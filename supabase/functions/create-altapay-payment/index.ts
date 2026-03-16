// GitHub Actions deploy test - 2026-03-16
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const cardTerminalName = Deno.env.get("ALTAPAY_TERMINAL_NAME");
    const swishTerminalName = Deno.env.get("ALTAPAY_SWISH_TERMINAL_NAME");

    if (!gatewayUrl || !apiUsername || !apiPassword || !cardTerminalName) {
      throw new Error(`AltaPay configuration is incomplete: gw=${!!gatewayUrl}, user=${!!apiUsername}, pass=${!!apiPassword}, cardTerm=${!!cardTerminalName}`);
    }
    logStep("AltaPay config debug", {
      gatewayUrl,
      cardTerminalName,
      swishTerminalName: swishTerminalName || "NOT SET",
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
    const { bookingId, amount, bookingType, terminalType, paymentType } = await req.json();
    if (!bookingId || !amount) {
      throw new Error("Missing bookingId or amount");
    }
    
    // Select terminal based on payment method
    const terminalName = terminalType === "swish" ? swishTerminalName : cardTerminalName;
    if (!terminalName) {
      throw new Error(`Terminal not configured for payment method: ${terminalType || "card"}`);
    }
    logStep("Request parsed", { bookingId, amount, bookingType, terminalType, terminalName });

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

    // callback_ok/fail/redirect = user browser redirects -> frontend pages
    // callback_notification = server-to-server -> edge function
    const frontendBase = "https://studentresor.com";

    // Generate a unique order ID for AltaPay
    const shopOrderId = `${bookingData.id.slice(0, 8)}-${Date.now()}`;

    // Build AltaPay createPaymentRequest
    const altapayApiUrl = `${gatewayUrl}/merchant/API/createPaymentRequest`;

    const formData = new URLSearchParams();
    formData.append("terminal", terminalName);
    formData.append("shop_orderid", shopOrderId);
    const amountInSEK = String(Math.round(Number(amount)));
    formData.append("amount", amountInSEK);
    formData.append("currency", "SEK");
    formData.append("type", "paymentAndCapture");
    // Browser redirects after payment - must be frontend pages
    // Callbacks point to edge function that accepts POST and 302-redirects to SPA
    const callbackBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/altapay-callback`;
    formData.append("config[callback_ok]", `${callbackBase}?type=ok`);
    formData.append("config[callback_fail]", `${callbackBase}?type=fail`);
    formData.append("config[callback_redirect]", `${callbackBase}?type=redirect`);
    // Server-to-server notification - edge function
    formData.append("config[callback_notification]", `${Deno.env.get("SUPABASE_URL")}/functions/v1/altapay-notification`);
    
    // Swish requires callback_form for custom styling (no hosted template support)
    if (terminalType === "swish") {
      formData.append("config[callback_form]", `${frontendBase}/pay/swish`);
      logStep("Swish: using callback_form for custom form rendering");
    }
    formData.append("customer_info[email]", user.email);
    formData.append("orderLines[0][description]", `Resa: ${bookingData.name}`);
    formData.append("orderLines[0][itemId]", bookingData.id.slice(0, 8));
    formData.append("orderLines[0][quantity]", "1");
    formData.append("orderLines[0][unitPrice]", amountInSEK);
    formData.append("orderLines[0][goodsType]", "item");

    // Transaction info for tracking
    formData.append("transaction_info[booking_id]", bookingId);
    formData.append("transaction_info[booking_type]", bookingType || "destination");
    formData.append("transaction_info[user_id]", user.id);
    formData.append("transaction_info[payment_type]", paymentType || "first_payment");

    // Debug: log entire request payload (excluding auth)
    logStep("REQUEST PAYLOAD", {
      terminal: terminalName,
      shop_orderid: shopOrderId,
      amount: amountInSEK,
      currency: "SEK",
      type: "paymentAndCapture",
      "config[callback_ok]": `${callbackBase}?type=ok`,
      "config[callback_fail]": `${callbackBase}?type=fail`,
      "config[callback_redirect]": `${callbackBase}?type=redirect`,
      "config[callback_notification]": `${Deno.env.get("SUPABASE_URL")}/functions/v1/altapay-notification`,
      "customer_info[email]": user.email,
      "orderLines[0][description]": `Resa: ${bookingData.name}`,
      "orderLines[0][unitPrice]": amountInSEK,
    });
    logStep("Calling AltaPay API", { url: altapayApiUrl, shopOrderId });

    // Make request to AltaPay with Basic Auth
    // Use TextEncoder to handle special characters in credentials
    const encoder = new TextEncoder();
    const credBytes = encoder.encode(`${apiUsername}:${apiPassword}`);
    const basicAuth = btoa(String.fromCharCode(...credBytes));
    
    const altapayResponse = await fetch(altapayApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const responseText = await altapayResponse.text();
    // Debug: log full XML response (mask sensitive parts)
    logStep("FULL XML RESPONSE", { body: responseText.substring(0, 2000) });
    
    // Extract key XML fields for debug
    const resultDebug = responseText.match(/<Result>(.*?)<\/Result>/)?.[1] || "N/A";
    const errorCodeDebug = responseText.match(/<ErrorCode>(.*?)<\/ErrorCode>/)?.[1] || "N/A";
    const errorMsgDebug = responseText.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/)?.[1] || "N/A";
    const merchantErrorDebug = responseText.match(/<MerchantErrorMessage>(.*?)<\/MerchantErrorMessage>/)?.[1] || "N/A";
    const urlDebug = responseText.match(/<Url>(.*?)<\/Url>/)?.[1] || "N/A";
    logStep("PARSED XML FIELDS", { Result: resultDebug, ErrorCode: errorCodeDebug, ErrorMessage: errorMsgDebug, MerchantErrorMessage: merchantErrorDebug, Url: urlDebug });
    
    logStep("AltaPay response status", { status: altapayResponse.status });

    if (!altapayResponse.ok) {
      logStep("AltaPay error response", { body: responseText });
      throw new Error(`AltaPay API error: ${altapayResponse.status}`);
    }

    // Parse XML response to extract payment URL and embedded URL
    const urlMatch = responseText.match(/<Url>(.*?)<\/Url>/);
    const dynamicJsUrlMatch = responseText.match(/<DynamicJavascriptUrl>(.*?)<\/DynamicJavascriptUrl>/);
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
    const embeddedUrl = dynamicJsUrlMatch?.[1]?.trim() || null;
    logStep("Payment URL obtained", { url: paymentUrl, embeddedUrl });

    // Extract payment ID for tracking
    const paymentIdMatch = responseText.match(/<PaymentId>(.*?)<\/PaymentId>/);
    const altapayPaymentId = paymentIdMatch?.[1] || null;

    // No pending payment record is created here.
    // The payment record will be created by altapay-notification
    // when AltaPay confirms the payment, avoiding duplicate pending entries.

    return new Response(JSON.stringify({ url: paymentUrl, embeddedUrl }), {
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
