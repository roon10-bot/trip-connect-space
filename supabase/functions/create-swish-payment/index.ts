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

    // Fix PEM formatting - handles multiple PEM blocks (cert chains)
    const fixPem = (pem: string): string => {
      // Replace escaped newlines
      let s = pem.replace(/\\n/g, "\n");
      
      // Find all PEM blocks (supports certificate chains with multiple certs)
      const pemBlocks: string[] = [];
      const regex = /(-----BEGIN [A-Z ]+-----)([\s\S]*?)(-----END [A-Z ]+-----)/g;
      let match;
      
      while ((match = regex.exec(s)) !== null) {
        const beginMarker = match[1];
        const base64Content = match[2].replace(/\s+/g, ""); // Strip all whitespace
        const endMarker = match[3];
        
        // Rebuild with 64-char lines
        const lines = [beginMarker];
        for (let i = 0; i < base64Content.length; i += 64) {
          lines.push(base64Content.substring(i, i + 64));
        }
        lines.push(endMarker);
        pemBlocks.push(lines.join("\n"));
      }
      
      if (pemBlocks.length === 0) throw new Error("No valid PEM blocks found");
      return pemBlocks.join("\n") + "\n";
    };

    const clientCert = fixPem(rawCert);
    const clientKey = fixPem(rawKey);

    // Count PEM blocks for diagnostics
    const certBlocks = (clientCert.match(/-----BEGIN/g) || []).length;
    const keyBlocks = (clientKey.match(/-----BEGIN/g) || []).length;
    
    logStep("Swish config loaded", {
      payeeNumber,
      certLength: clientCert.length,
      keyLength: clientKey.length,
      certBlocks,
      keyBlocks,
      certFirst60: clientCert.substring(0, 60),
      certLast60: clientCert.substring(clientCert.length - 60),
      keyFirst60: clientKey.substring(0, 60),
    });

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user via JWT claims (does not require server-side session)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims)
      throw new Error(`Authentication error: ${claimsError?.message || "Invalid token"}`);

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userId || !userEmail)
      throw new Error("User not authenticated or email not available");
    logStep("User authenticated via claims", { userId, email: userEmail });

    // Parse request body
    const { bookingId, amount, bookingType, payerPhone, isDesktop, isNativeApp } = await req.json();
    if (!bookingId || !amount) {
      throw new Error("Missing bookingId or amount");
    }
    if (isNativeApp && !payerPhone) {
      throw new Error("Telefonnummer krävs för Swish-betalning i appen");
    }
    logStep("Request parsed", { bookingId, amount, bookingType, payerPhone, isDesktop, isNativeApp });

    // Verify booking access (same logic as other payment functions)
    let bookingData: { id: string; name: string };

    if (bookingType === "trip") {
      const { data: tripBooking, error: tripError } = await supabaseClient
        .from("trip_bookings")
        .select("*, trips(name, trip_type)")
        .eq("id", bookingId)
        .maybeSingle();

      if (tripError || !tripBooking) throw new Error("Trip booking not found");

      const isBooker = tripBooking.user_id === userId;
      if (!isBooker) {
        const { data: traveler } = await supabaseClient
          .from("trip_booking_travelers")
          .select("id")
          .eq("trip_booking_id", bookingId)
          .eq("email", userEmail)
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
        .eq("user_id", userId)
        .maybeSingle();

      if (bookingError || !booking) throw new Error("Booking not found or access denied");

      bookingData = {
        id: booking.id,
        name: booking.destinations?.name || "Destination",
      };
    }

    // Build Swish payment request
    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/swish-callback`;
    // Generate instruction UUID for v2 API (32 hex chars, uppercase)
    const instructionUUID = crypto.randomUUID().replace(/-/g, "").toUpperCase();
    const amountNumber = Math.round(Number(amount));
    
    // Sanitize message: only allowed chars a-ö, A-Ö, 0-9, and !?(),.-:;
    const rawMessage = `${bookingData.name} - ${bookingData.id.slice(0, 8).toUpperCase()}`;
    const safeMessage = rawMessage.replace(/[^\w\såäöÅÄÖ0-9!?(),.\-:;]/g, "").substring(0, 50);

    const swishPayload: Record<string, string> = {
      payeePaymentReference: instructionUUID.substring(0, 35),
      callbackUrl,
      payeeAlias: payeeNumber,
      amount: amountNumber.toFixed(2),
      currency: "SEK",
      message: safeMessage,
    };

    // Only include payerAlias on mobile – desktop uses QR scan (open payment request)
    if (isNativeApp && payerPhone) {
      swishPayload.payerAlias = payerPhone;
    }

    logStep("Swish payload", swishPayload);

    // Create mTLS HTTP client using Deno API
    const httpClient = Deno.createHttpClient({
      cert: clientCert,
      key: clientKey,
    });

    // Swish v2 API: PUT with UUID in URL
    const swishApiUrl = `https://cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionUUID}`;

    logStep("Calling Swish API", { url: swishApiUrl, method: "PUT" });

    const swishResponse = await fetch(swishApiUrl, {
      method: "PUT",
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
      const paymentRequestTokenHeader = swishResponse.headers.get("PaymentRequestToken") || "";
      
      // Extract payment request ID from Location URL
      const swishPaymentId = locationHeader.split("/").pop() || instructionUUID;
      const paymentRequestToken = paymentRequestTokenHeader || swishPaymentId;

      logStep("Swish payment created", {
        location: locationHeader,
        tokenSource: paymentRequestTokenHeader ? "header" : "location-id-fallback",
        swishPaymentId,
      });

      // Store pending payment info in database
      await supabaseClient.from("payments").insert({
        trip_booking_id: bookingId,
        amount: amountNumber,
        status: "pending",
        payment_type: "swish",
        user_id: userId,
        provider_transaction_id: swishPaymentId,
        payment_provider: "swish",
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
