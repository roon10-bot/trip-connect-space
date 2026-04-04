import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email)
      throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();

    // Support both new and legacy parameter names
    const effectiveBookingId = body.booking_id || body.bookingId;
    const effectiveAmount = body.amount;
    const effectiveMethod = body.payment_method ||
      (body.paymentMethodType === "klarna" ? "klarna" : "card");
    const bookingType = body.bookingType || "trip";
    const paymentType = body.payment_type || body.paymentType || "installment";

    if (!effectiveBookingId || !effectiveAmount) {
      throw new Error("Missing booking_id or amount");
    }

    logStep("Request parsed", {
      bookingId: effectiveBookingId,
      amount: effectiveAmount,
      method: effectiveMethod,
      bookingType,
    });

    // ====== CARD (AltaPay) ======
    if (effectiveMethod === "card") {
      logStep("Routing to create-altapay-payment");

      const proxyRes = await fetch(
        `${supabaseUrl}/functions/v1/create-altapay-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
          body: JSON.stringify({
            bookingId: effectiveBookingId,
            amount: effectiveAmount,
            bookingType,
            terminalType: "card",
            paymentType,
          }),
        }
      );

      const proxyData = await proxyRes.json();
      if (!proxyRes.ok) {
        throw new Error(proxyData.error || "AltaPay payment creation failed");
      }

      logStep("AltaPay proxy success", { hasUrl: !!proxyData.url });

      return new Response(
        JSON.stringify({
          payment_url: proxyData.url,
          amount: effectiveAmount,
          installment_number: body.installment_number,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ====== SWISH (Direct) ======
    if (effectiveMethod === "swish") {
      logStep("Routing to create-swish-payment");

      const proxyRes = await fetch(
        `${supabaseUrl}/functions/v1/create-swish-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
          body: JSON.stringify({
            bookingId: effectiveBookingId,
            amount: effectiveAmount,
            bookingType,
            payerPhone: body.payer_phone || body.payerPhone,
            isDesktop: body.is_desktop ?? body.isDesktop,
            isNativeApp: body.is_native_app ?? body.isNativeApp,
          }),
        }
      );

      const proxyData = await proxyRes.json();
      if (!proxyRes.ok) {
        throw new Error(proxyData.error || "Swish payment creation failed");
      }

      logStep("Swish proxy success", {
        hasToken: !!proxyData.paymentRequestToken,
      });

      return new Response(
        JSON.stringify({
          success: true,
          payment_request_token: proxyData.paymentRequestToken,
          swish_payment_id: proxyData.swishPaymentId,
          amount: effectiveAmount,
          installment_number: body.installment_number,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ====== KLARNA (Stripe) ======
    logStep("Processing Klarna/Stripe payment");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Verify booking access
    let bookingData: { id: string; name: string; description: string };

    if (bookingType === "trip") {
      const { data: tripBooking, error: tripError } = await supabaseClient
        .from("trip_bookings")
        .select("*, trips(name, trip_type)")
        .eq("id", effectiveBookingId)
        .maybeSingle();

      if (tripError || !tripBooking) {
        throw new Error("Trip booking not found");
      }

      const isBooker = tripBooking.user_id === user.id;
      if (!isBooker) {
        const { data: traveler } = await supabaseClient
          .from("trip_booking_travelers")
          .select("id")
          .eq("trip_booking_id", effectiveBookingId)
          .eq("email", user.email)
          .maybeSingle();

        if (!traveler) {
          throw new Error("Access denied: you are not part of this booking");
        }
      }

      bookingData = {
        id: tripBooking.id,
        name: tripBooking.trips?.name || "Resa",
        description: `Bokningsnummer: ${tripBooking.id.slice(0, 8).toUpperCase()} | ${tripBooking.trips?.trip_type || ""}`,
      };
    } else {
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .select("*, destinations(name, country)")
        .eq("id", effectiveBookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (bookingError || !booking) {
        throw new Error("Booking not found or access denied");
      }

      bookingData = {
        id: booking.id,
        name: booking.destinations?.name || "Destination",
        description: `Bokningsnummer: ${booking.id.slice(0, 8).toUpperCase()} | ${booking.destinations?.country || ""}`,
      };
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://studentresor.com";

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: `Resa: ${bookingData.name}`,
              description: bookingData.description,
            },
            unit_amount: Math.round(Number(effectiveAmount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success&booking=${effectiveBookingId}`,
      cancel_url: `${origin}/dashboard?payment=cancelled&booking=${effectiveBookingId}`,
      metadata: {
        booking_id: effectiveBookingId,
        booking_type: bookingType,
        user_id: user.id,
      },
      payment_method_types: ["klarna"],
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Stripe session created");

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
