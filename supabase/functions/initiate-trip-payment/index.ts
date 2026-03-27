import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DUFFEL_API_URL = "https://api.duffel.com";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[INITIATE-TRIP-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user (optional - guest checkout supported)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData?.user?.id) {
        userId = userData.user.id;
        userEmail = userData.user.email || null;
        logStep("User authenticated", { userId, email: userEmail });
      }
    }

    // Parse request
    const {
      trip_id,
      travelers,
      travelers_info,
      total_price,
      discount_code,
      discount_amount,
      payment_method, // "card" or "swish"
      turnstile_token,
      // Swish-specific
      payer_phone,
      is_desktop,
      is_native_app,
    } = await req.json();

    // Use primary traveler email if no authenticated user
    const primaryEmail = travelers_info?.[0]?.email || userEmail || "";
    if (!primaryEmail) throw new Error("No email available for booking");

    if (!trip_id || !travelers || !travelers_info || !total_price || !payment_method) {
      throw new Error("Missing required fields");
    }
    logStep("Request parsed", { trip_id, travelers, payment_method, total_price });

    // Verify Turnstile token
    if (turnstile_token) {
      const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
      if (turnstileSecret) {
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ secret: turnstileSecret, response: turnstile_token }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          logStep("Turnstile verification failed", { errorCodes: verifyData["error-codes"] || [] });
          throw new Error("Turnstile verification failed");
        }
        logStep("Turnstile verified");
      }
    }

    // Load trip data
    const { data: trip, error: tripError } = await supabaseClient
      .from("trips")
      .select("*")
      .eq("id", trip_id)
      .single();
    if (tripError || !trip) throw new Error("Trip not found");
    if (!trip.is_active) throw new Error("Trip is not active");
    if (trip.is_fullbooked) throw new Error("Trip is fully booked");
    logStep("Trip loaded", { name: trip.name, departure_location: trip.departure_location });

    // Calculate booking fee (40% of total price)
    const bookingFeeAmount = Math.ceil(total_price * 0.40);
    logStep("Booking fee calculated", { bookingFeeAmount, totalPrice: total_price });

    // Fetch fresh Duffel flight offer
    const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
    let duffelOfferId: string | null = null;
    let duffelOfferData: any = null;
    let flightPriceSek = 0;

    if (DUFFEL_API_KEY) {
      // Extract IATA from departure_location like "Kastrup (CPH)"
      const iataMatch = trip.departure_location.match(/\(([A-Z]{3})\)/);
      const originIATA = iataMatch?.[1];

      if (originIATA) {
        logStep("Fetching Duffel offer", { origin: originIATA, destination: "SPU" });

        const slices = [
          { origin: originIATA, destination: "SPU", departure_date: trip.departure_date },
          { origin: "SPU", destination: originIATA, departure_date: trip.return_date },
        ];

        const offerRes = await fetch(`${DUFFEL_API_URL}/air/offer_requests`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DUFFEL_API_KEY}`,
            "Content-Type": "application/json",
            "Duffel-Version": "v2",
            Accept: "application/json",
          },
          body: JSON.stringify({
            data: {
              slices,
              passengers: Array.from({ length: travelers }, () => ({ type: "adult" })),
              cabin_class: "economy",
            },
          }),
        });

        if (offerRes.ok) {
          const offerResponseData = await offerRes.json();
          const offers = offerResponseData.data?.offers || [];

          if (offers.length > 0) {
            // Pick cheapest offer
            const cheapest = offers.sort(
              (a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount)
            )[0];

            // Get EUR→SEK rate
            let eurToSek = 11.50;
            try {
              const fxRes = await fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=SEK");
              if (fxRes.ok) {
                const fxData = await fxRes.json();
                eurToSek = fxData.rates?.SEK || eurToSek;
              }
            } catch { /* use fallback */ }

            const totalOriginal = parseFloat(cheapest.total_amount);
            const currency = cheapest.total_currency || "EUR";
            const conversionRate = currency === "SEK" ? 1 : eurToSek;
            flightPriceSek = Math.ceil(totalOriginal * conversionRate);

            duffelOfferId = cheapest.id;
            duffelOfferData = {
              id: cheapest.id,
              total_amount: cheapest.total_amount,
              total_currency: currency,
              total_amount_sek: flightPriceSek,
              airline: cheapest.owner?.name || "Unknown",
              airline_logo: cheapest.owner?.logo_symbol_url || null,
              slices: cheapest.slices?.map((slice: any) => ({
                origin: slice.origin?.iata_code,
                destination: slice.destination?.iata_code,
                departure_time: slice.segments?.[0]?.departing_at,
                arrival_time: slice.segments?.[slice.segments.length - 1]?.arriving_at,
                stops: (slice.segments?.length || 1) - 1,
              })),
            };
            logStep("Duffel offer found", {
              offerId: duffelOfferId,
              flightPriceSek,
              airline: duffelOfferData.airline,
            });
          } else {
            logStep("No Duffel offers available");
          }
        } else {
          const errText = await offerRes.text();
          logStep("Duffel offer request failed", { status: offerRes.status, body: errText.substring(0, 300) });
        }
      }
    }

    // Store pending booking
    const bookingData = {
      travelers,
      travelers_info,
      discount_code,
      discount_amount,
    };

    const { data: pendingBooking, error: pendingError } = await supabaseClient
      .from("pending_trip_bookings")
      .insert({
        trip_id,
        user_id: userId,
        booking_data: bookingData,
        duffel_offer_id: duffelOfferId,
        duffel_offer_data: duffelOfferData,
        flight_price_sek: flightPriceSek,
        booking_fee_amount: bookingFeeAmount,
        total_price,
        discount_code: discount_code || null,
        discount_amount: discount_amount || 0,
        payment_method,
        status: "awaiting_payment",
      })
      .select("id")
      .single();

    if (pendingError || !pendingBooking) {
      throw new Error(`Failed to create pending booking: ${pendingError?.message}`);
    }
    const pendingBookingId = pendingBooking.id;
    logStep("Pending booking created", { pendingBookingId });

    // Initiate payment based on method
    if (payment_method === "card") {
      // AltaPay card payment
      const gatewayUrl = (Deno.env.get("ALTAPAY_GATEWAY_URL") || "").trim().replace(/\/+$/, "");
      const apiUsername = Deno.env.get("ALTAPAY_API_USERNAME");
      const apiPassword = Deno.env.get("ALTAPAY_API_PASSWORD");
      const terminalName = Deno.env.get("ALTAPAY_TERMINAL_NAME");

      if (!gatewayUrl || !apiUsername || !apiPassword || !terminalName) {
        throw new Error("AltaPay configuration incomplete");
      }

      logStep("AltaPay config", { gatewayUrl, terminalName });

      // Build Basic Auth - use TextEncoder to handle special characters
      const encoder = new TextEncoder();
      const credBytes = encoder.encode(`${apiUsername}:${apiPassword}`);
      const basicAuth = btoa(String.fromCharCode(...credBytes));

      const shopOrderId = `PB-${pendingBookingId.slice(0, 8)}-${Date.now()}`;
      const callbackBase = `${Deno.env.get("SUPABASE_URL")}/functions/v1/altapay-callback`;

      const formData = new URLSearchParams();
      formData.append("terminal", terminalName);
      formData.append("shop_orderid", shopOrderId);
      formData.append("amount", String(bookingFeeAmount));
      formData.append("currency", "SEK");
      formData.append("type", "paymentAndCapture");
      formData.append("config[callback_ok]", `${callbackBase}?type=ok`);
      formData.append("config[callback_fail]", `${callbackBase}?type=fail`);
      formData.append("config[callback_redirect]", `${callbackBase}?type=redirect`);
      formData.append("config[callback_notification]", `${Deno.env.get("SUPABASE_URL")}/functions/v1/altapay-notification`);
      formData.append("customer_info[email]", userEmail);
      formData.append("orderLines[0][description]", `Bokningsavgift: ${trip.name}`);
      formData.append("orderLines[0][itemId]", pendingBookingId.slice(0, 8));
      formData.append("orderLines[0][quantity]", "1");
      formData.append("orderLines[0][unitPrice]", String(bookingFeeAmount));
      formData.append("orderLines[0][goodsType]", "item");

      // Transaction info for webhook
      formData.append("transaction_info[pending_booking_id]", pendingBookingId);
      formData.append("transaction_info[booking_type]", "pending_trip");
      formData.append("transaction_info[user_id]", userId);
      formData.append("transaction_info[payment_type]", "booking_fee");

      logStep("Calling AltaPay createPaymentRequest", { shopOrderId, amount: bookingFeeAmount, terminal: terminalName });

      const altapayResponse = await fetch(`${gatewayUrl}/merchant/API/createPaymentRequest`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await altapayResponse.text();
      logStep("AltaPay response", { status: altapayResponse.status, body: responseText.substring(0, 1500) });

      const resultMatch = responseText.match(/<Result>(.*?)<\/Result>/);
      if (resultMatch && resultMatch[1] !== "Success") {
        const errorMsg = responseText.match(/<MerchantErrorMessage>(.*?)<\/MerchantErrorMessage>/);
        const bodyMsg = responseText.match(/<Body>(.*?)<\/Body>/s);
        logStep("AltaPay error details", { result: resultMatch[1], merchantError: errorMsg?.[1], body: bodyMsg?.[1]?.substring(0, 500) });
        throw new Error(`AltaPay error: ${errorMsg?.[1] || resultMatch[1]}`);
      }

      const urlMatch = responseText.match(/<Url>(.*?)<\/Url>/);
      if (!urlMatch?.[1]) {
        logStep("AltaPay response missing URL - full body", { body: responseText.substring(0, 2000) });
        throw new Error("Could not get payment URL from AltaPay");
      }

      const paymentUrl = urlMatch[1].trim();

      // Update pending booking with payment reference
      await supabaseClient
        .from("pending_trip_bookings")
        .update({ payment_reference: shopOrderId })
        .eq("id", pendingBookingId);

      logStep("AltaPay payment initiated", { paymentUrl: paymentUrl.substring(0, 50) });

      return new Response(JSON.stringify({
        pending_booking_id: pendingBookingId,
        payment_url: paymentUrl,
        booking_fee: bookingFeeAmount,
        flight_price_sek: flightPriceSek,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (payment_method === "swish") {
      // Swish payment
      const rawCert = Deno.env.get("SWISH_CLIENT_CERT");
      const rawKey = Deno.env.get("SWISH_CLIENT_KEY");
      const payeeNumber = Deno.env.get("SWISH_PAYEE_NUMBER");

      if (!rawCert || !rawKey || !payeeNumber) {
        throw new Error("Swish configuration incomplete");
      }

      const fixPem = (pem: string): string => {
        let s = pem.replace(/\\n/g, "\n");
        const pemBlocks: string[] = [];
        const regex = /(-----BEGIN [A-Z ]+-----)([\s\S]*?)(-----END [A-Z ]+-----)/g;
        let match;
        while ((match = regex.exec(s)) !== null) {
          const beginMarker = match[1];
          const base64Content = match[2].replace(/\s+/g, "");
          const endMarker = match[3];
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

      const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/swish-callback`;
      const instructionUUID = crypto.randomUUID().replace(/-/g, "").toUpperCase();

      const rawMessage = `Bokningsavgift ${trip.name.substring(0, 30)}`;
      const safeMessage = rawMessage.replace(/[^\w\såäöÅÄÖ0-9!?(),.\-:;]/g, "").substring(0, 50);

      const swishPayload: Record<string, string> = {
        payeePaymentReference: pendingBookingId.replace(/-/g, "").substring(0, 35),
        callbackUrl,
        payeeAlias: payeeNumber,
        amount: bookingFeeAmount.toFixed(2),
        currency: "SEK",
        message: safeMessage,
      };

      if (is_native_app && payer_phone) {
        swishPayload.payerAlias = payer_phone;
      }

      const httpClient = Deno.createHttpClient({
        cert: clientCert,
        key: clientKey,
      });

      const swishApiUrl = `https://cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests/${instructionUUID}`;

      const swishResponse = await fetch(swishApiUrl, {
        method: "PUT",
        // @ts-ignore - Deno.createHttpClient client option
        client: httpClient,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swishPayload),
      });

      const responseStatus = swishResponse.status;
      logStep("Swish response", { status: responseStatus });

      if (responseStatus === 201) {
        const locationHeader = swishResponse.headers.get("Location") || "";
        const paymentRequestTokenHeader = swishResponse.headers.get("PaymentRequestToken") || "";
        const swishPaymentId = locationHeader.split("/").pop() || instructionUUID;
        const paymentRequestToken = paymentRequestTokenHeader || swishPaymentId;

        // Note: Payment record will be created by swish-callback/finalize-trip-booking
        // after the booking is confirmed, since we don't have a trip_booking_id yet

        // Update pending booking with payment reference
        await supabaseClient
          .from("pending_trip_bookings")
          .update({ payment_reference: swishPaymentId })
          .eq("id", pendingBookingId);

        await swishResponse.text();
        httpClient.close();

        logStep("Swish payment initiated", { swishPaymentId });

        return new Response(JSON.stringify({
          pending_booking_id: pendingBookingId,
          payment_request_token: paymentRequestToken,
          swish_payment_id: swishPaymentId,
          booking_fee: bookingFeeAmount,
          flight_price_sek: flightPriceSek,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        const errorBody = await swishResponse.text();
        httpClient.close();
        throw new Error(`Swish error (${responseStatus}): ${errorBody}`);
      }
    } else {
      throw new Error(`Unknown payment method: ${payment_method}`);
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
