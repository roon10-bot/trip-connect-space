import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-ALTAPAY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const gatewayUrl = (Deno.env.get("ALTAPAY_GATEWAY_URL") || "").trim().replace(/\/+$/, "");
    const apiUsername = Deno.env.get("ALTAPAY_API_USERNAME");
    const apiPassword = Deno.env.get("ALTAPAY_API_PASSWORD");
    const terminalName = Deno.env.get("ALTAPAY_TERMINAL_NAME");

    if (!gatewayUrl || !apiUsername || !apiPassword || !terminalName) {
      throw new Error(`AltaPay configuration is incomplete: gw=${!!gatewayUrl}, user=${!!apiUsername}, pass=${!!apiPassword}, term=${!!terminalName}`);
    }
    logStep("AltaPay config debug", {
      gatewayUrl,
      terminalName,
      usernameLength: apiUsername.length,
      usernamePrefix: apiUsername.substring(0, 4),
      passwordLength: apiPassword.length,
    });

    // Create Supabase client with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
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

    let bookingData: { id: string; name: string; description: string };

    if (bookingType === "trip") {
      const { data: tripBooking, error: tripError } = await supabaseClient
        .from("trip_bookings")
        .select("*, trips(name, trip_type)")
        .eq("id", bookingId)
        .maybeSingle();

      if (tripError || !tripBooking) {
        throw new Error("Trip booking not found");
      }

      // Verify user is either the booker or a traveler
      const isBooker = tripBooking.user_id === user.id;
      if (!isBooker) {
        const { data: traveler } = await supabaseClient
          .from("trip_booking_travelers")
          .select("id")
          .eq("trip_booking_id", bookingId)
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
      logStep("Trip booking verified", { bookingId: tripBooking.id, isBooker });
    } else {
      const { data: booking, error: bookingError } = await supabaseClient
        .from("bookings")
        .select("*, destinations(name, country)")
        .eq("id", bookingId)
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
      logStep("Booking verified", { bookingId: booking.id });
    }

    const origin = req.headers.get("origin") || "https://localhost:3000";

    // Generate a unique order ID for AltaPay
    const shopOrderId = `${bookingData.id.slice(0, 8)}-${Date.now()}`;

    // Build AltaPay createPaymentRequest
    const altapayApiUrl = `${gatewayUrl}/merchant/API/createPaymentRequest`;

    const formData = new URLSearchParams();
    formData.append("terminal", terminalName);
    formData.append("shop_orderid", shopOrderId);
    formData.append("amount", String(amount));
    formData.append("currency", "SEK");
    formData.append("config[callback_form]", `${origin}/dashboard?payment=form&booking=${bookingId}`);
    formData.append("config[callback_ok]", `${origin}/dashboard?payment=success&booking=${bookingId}`);
    formData.append("config[callback_fail]", `${origin}/dashboard?payment=failed&booking=${bookingId}`);
    formData.append("config[callback_redirect]", `${origin}/dashboard?payment=success&booking=${bookingId}`);
    formData.append("customer_info[email]", user.email);
    formData.append("orderLines[0][description]", `Resa: ${bookingData.name}`);
    formData.append("orderLines[0][itemId]", bookingData.id.slice(0, 8));
    formData.append("orderLines[0][quantity]", "1");
    formData.append("orderLines[0][unitPrice]", String(amount));
    formData.append("orderLines[0][goodsType]", "item");

    // Transaction info for tracking
    formData.append("transaction_info[booking_id]", bookingId);
    formData.append("transaction_info[booking_type]", bookingType || "destination");
    formData.append("transaction_info[user_id]", user.id);

    logStep("Calling AltaPay API", { url: altapayApiUrl, shopOrderId });

    // Make request to AltaPay with Basic Auth
    // Use TextEncoder to handle special characters in credentials
    const encoder = new TextEncoder();
    const credBytes = encoder.encode(`${apiUsername}:${apiPassword}`);
    const basicAuth = btoa(String.fromCharCode(...credBytes));
    
    // First test connectivity with getTerminals
    const testUrl = `${gatewayUrl}/merchant/API/getTerminals`;
    logStep("Testing AltaPay connectivity", { testUrl });
    const testResponse = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
      },
    });
    const testBody = await testResponse.text();
    logStep("AltaPay test response", { status: testResponse.status, body: testBody.substring(0, 300) });
    
    if (!testResponse.ok) {
      throw new Error(`AltaPay auth test failed: ${testResponse.status} - credentials are invalid`);
    }

    const altapayResponse = await fetch(altapayApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await altapayResponse.text();
    logStep("AltaPay response status", { status: altapayResponse.status });

    if (!altapayResponse.ok) {
      logStep("AltaPay error response", { body: responseText });
      throw new Error(`AltaPay API error: ${altapayResponse.status}`);
    }

    // Parse XML response to extract payment URL
    // AltaPay returns XML with <Url> element
    const urlMatch = responseText.match(/<Url>(.*?)<\/Url>/);
    const resultMatch = responseText.match(/<Result>(.*?)<\/Result>/);

    if (resultMatch && resultMatch[1] !== "Success") {
      const errorMsg = responseText.match(/<MerchantErrorMessage>(.*?)<\/MerchantErrorMessage>/);
      throw new Error(`AltaPay error: ${errorMsg?.[1] || resultMatch[1]}`);
    }

    if (!urlMatch || !urlMatch[1]) {
      logStep("Could not parse payment URL from response", { body: responseText.substring(0, 500) });
      throw new Error("Could not get payment URL from AltaPay");
    }

    const paymentUrl = urlMatch[1].trim();
    logStep("Payment URL obtained", { url: paymentUrl });

    // Extract payment ID for tracking
    const paymentIdMatch = responseText.match(/<PaymentId>(.*?)<\/PaymentId>/);
    const altapayPaymentId = paymentIdMatch?.[1] || null;

    // Create a pending payment record
    const { error: paymentInsertError } = await supabaseClient
      .from("payments")
      .insert({
        trip_booking_id: bookingId,
        user_id: user.id,
        amount: Number(amount),
        payment_type: "altapay_payment",
        status: "pending",
        stripe_session_id: altapayPaymentId, // Reusing field for AltaPay payment ID
      });

    if (paymentInsertError) {
      logStep("Warning: Could not create payment record", { error: paymentInsertError.message });
    }

    return new Response(JSON.stringify({ url: paymentUrl }), {
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
