import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-SWISH-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Load Swish credentials from secrets
    const rawCert = Deno.env.get("SWISH_CLIENT_CERT");
    const rawKey = Deno.env.get("SWISH_CLIENT_KEY");
    const payeeNumber = Deno.env.get("SWISH_PAYEE_NUMBER");

    if (!rawCert || !rawKey || !payeeNumber) {
      throw new Error(
        `Swish config incomplete: cert=${!!rawCert}, key=${!!rawKey}, payee=${!!payeeNumber}`
      );
    }

    // Fix PEM formatting - secrets storage may corrupt whitespace/newlines
    const fixPem = (pem: string): string => {
      // Replace escaped newlines with real ones
      let fixed = pem.replace(/\\n/g, "\n");
      // Split into lines, trim each line, remove empty lines within base64 content
      const lines = fixed.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      // Rejoin with proper newlines
      return lines.join("\n") + "\n";
    };

    const clientCert = fixPem(rawCert);
    const clientKey = fixPem(rawKey);

    logStep("Swish config loaded", {
      payeeNumber,
      certLength: clientCert.length,
      keyLength: clientKey.length,
      certStart: clientCert.substring(0, 40),
      keyStart: clientKey.substring(0, 40),
      certHasNewlines: clientCert.includes("\n"),
      keyHasNewlines: clientKey.includes("\n"),
    });

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { bookingId, amount, bookingType } = await req.json();
    if (!bookingId || !amount) {
      throw new Error("Missing bookingId or amount");
    }
    logStep("Request parsed", { bookingId, amount, bookingType });

    // Verify booking access (same logic as other payment functions)
    let bookingData: { id: string; name: string };

    if (bookingType === "trip") {
      const { data: tripBooking, error: tripError } = await supabaseClient
        .from("trip_bookings")
        .select("*, trips(name, trip_type)")
        .eq("id", bookingId)
        .maybeSingle();

      if (tripError || !tripBooking) throw new Error("Trip booking not found");

      const isBooker = tripBooking.user_id === user.id;
      if (!isBooker) {
        const { data: traveler } = await supabaseClient
          .from("trip_booking_travelers")
          .select("id")
          .eq("trip_booking_id", bookingId)
          .eq("email", user.email)
          .maybeSingle();

        if (!traveler) throw new Error("Access denied: you are not part of this booking");
      }

      bookingData = {
        id: tripBooking.id,
        name: tripBooking.trips?.name || "Resa",
      };
      logStep("Trip booking verified", { bookingId: tripBooking.id, isBooker });
    } else {
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .select("*, destinations(name)")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (bookingError || !booking) throw new Error("Booking not found or access denied");

      bookingData = {
        id: booking.id,
        name: booking.destinations?.name || "Destination",
      };
    }

    // Build Swish payment request
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/swish-callback`;
    const paymentRef = crypto.randomUUID().replace(/-/g, "").toUpperCase();
    const amountNumber = Math.round(Number(amount));

    const swishPayload = {
      payeePaymentReference: paymentRef,
      callbackUrl,
      payerAlias: "", // Will be filled by Swish app
      payeeAlias: payeeNumber,
      amount: String(amountNumber),
      currency: "SEK",
      message: `${bookingData.name} - ${bookingData.id.slice(0, 8).toUpperCase()}`,
    };

    logStep("Swish payload", swishPayload);

    // Create mTLS HTTP client using Deno API
    const httpClient = Deno.createHttpClient({
      certChain: clientCert,
      privateKey: clientKey,
    });

    // Swish production API endpoint
    const swishApiUrl = "https://cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests";

    logStep("Calling Swish API", { url: swishApiUrl });

    const swishResponse = await fetch(swishApiUrl, {
      method: "POST",
      // @ts-ignore - Deno.createHttpClient client option
      client: httpClient,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(swishPayload),
    });

    const responseStatus = swishResponse.status;
    logStep("Swish response status", { status: responseStatus });

    if (responseStatus === 201) {
      // Success - extract payment request token from Location header
      const locationHeader = swishResponse.headers.get("Location") || "";
      const paymentRequestToken = swishResponse.headers.get("PaymentRequestToken") || "";
      
      // Extract payment request ID from Location URL
      const swishPaymentId = locationHeader.split("/").pop() || paymentRef;

      logStep("Swish payment created", {
        location: locationHeader,
        token: paymentRequestToken ? "present" : "missing",
        swishPaymentId,
      });

      // Store pending payment info in database
      await supabaseClient.from("payments").insert({
        trip_booking_id: bookingId,
        amount: amountNumber,
        status: "pending",
        payment_type: "swish",
        user_id: user.id,
        stripe_payment_intent_id: swishPaymentId, // Reuse column for Swish payment ID
      });

      logStep("Pending payment record created");

      // Consume response body
      await swishResponse.text();

      // Close the HTTP client
      httpClient.close();

      return new Response(
        JSON.stringify({
          success: true,
          paymentRequestToken,
          swishPaymentId,
          message: "Öppna Swish-appen för att slutföra betalningen",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Error from Swish
      const errorBody = await swishResponse.text();
      logStep("Swish error response", { status: responseStatus, body: errorBody });
      httpClient.close();

      let errorMessage = "Swish-betalning misslyckades";
      try {
        const errors = JSON.parse(errorBody);
        if (Array.isArray(errors) && errors.length > 0) {
          errorMessage = errors.map((e: any) => e.errorMessage || e.additionalInformation).join(", ");
        }
      } catch {
        errorMessage = errorBody || errorMessage;
      }

      throw new Error(`Swish error (${responseStatus}): ${errorMessage}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
