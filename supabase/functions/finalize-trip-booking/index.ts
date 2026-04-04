import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DUFFEL_API_URL = "https://api.duffel.com";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FINALIZE-TRIP-BOOKING] ${step}${detailsStr}`);
};

/**
 * Called by webhooks (altapay-notification, swish-callback) after payment is confirmed.
 * 1. Reads pending booking data
 * 2. Creates the actual trip booking via create_trip_booking_atomic
 * 3. Inserts travelers
 * 4. Purchases Duffel flight
 * 5. Records payment
 * 6. Cleans up pending booking
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const {
      pending_booking_id,
      payment_amount,
      payment_provider,
      provider_transaction_id,
    } = await req.json();

    if (!pending_booking_id) throw new Error("Missing pending_booking_id");
    logStep("Request parsed", { pending_booking_id, payment_amount, payment_provider });

    // 1. Load pending booking
    const { data: pending, error: pendingError } = await supabase
      .from("pending_trip_bookings")
      .select("*")
      .eq("id", pending_booking_id)
      .single();

    if (pendingError || !pending) {
      throw new Error(`Pending booking not found: ${pendingError?.message}`);
    }

    if (pending.status !== "awaiting_payment") {
      logStep("Pending booking already processed", { status: pending.status });
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Pending booking loaded", {
      tripId: pending.trip_id,
      userId: pending.user_id,
      totalPrice: pending.total_price,
    });

    const bookingData = pending.booking_data as any;
    const travelersInfo = bookingData.travelers_info;
    const primaryTraveler = travelersInfo[0];

    // 2. Create actual booking via atomic function
    const { data: bookingId, error: bookingError } = await supabase.rpc(
      "create_trip_booking_atomic",
      {
        p_trip_id: pending.trip_id,
        p_user_id: pending.user_id,
        p_first_name: primaryTraveler.first_name,
        p_last_name: primaryTraveler.last_name,
        p_email: primaryTraveler.email,
        p_birth_date: primaryTraveler.birth_date,
        p_phone: primaryTraveler.phone,
        p_departure_location: primaryTraveler.departure_location,
        p_travelers: bookingData.travelers,
        p_total_price: pending.total_price,
        p_discount_code: pending.discount_code || null,
        p_discount_amount: pending.discount_amount || 0,
      }
    );

    if (bookingError) {
      logStep("Booking creation failed", { error: bookingError.message });
      // Mark pending as failed
      await supabase
        .from("pending_trip_bookings")
        .update({ status: "failed" })
        .eq("id", pending_booking_id);
      throw new Error(`Booking creation failed: ${bookingError.message}`);
    }

    logStep("Booking created", { bookingId });

    // 3. Insert additional travelers
    if (travelersInfo.length > 0) {
      const travelerRows = travelersInfo.map((t: any, idx: number) => ({
        trip_booking_id: bookingId,
        traveler_index: idx,
        first_name: t.first_name,
        last_name: t.last_name,
        email: t.email,
        birth_date: t.birth_date,
        phone: t.phone,
        departure_location: t.departure_location,
        discount_code_id: t.discount_code_id || null,
        discount_amount: t.discount_amount || 0,
      }));

      const { error: travelersError } = await supabase
        .from("trip_booking_travelers")
        .insert(travelerRows);

      if (travelersError) {
        logStep("Error inserting travelers", { error: travelersError.message });
      } else {
        logStep("Travelers inserted", { count: travelerRows.length });
      }

      // 3b. Record discount code usage per traveler email
      const discountUses = travelersInfo
        .filter((t: any) => t.discount_code_id && t.email)
        .map((t: any) => ({
          discount_code_id: t.discount_code_id,
          email: t.email.toLowerCase().trim(),
          trip_booking_id: bookingId,
        }));

      if (discountUses.length > 0) {
        const { error: usesError } = await supabase
          .from("discount_code_uses")
          .upsert(discountUses, { onConflict: "discount_code_id,email", ignoreDuplicates: true });

        if (usesError) {
          logStep("Error recording discount uses", { error: usesError.message });
        } else {
          logStep("Discount uses recorded", { count: discountUses.length });
        }
      }
    }

    // 4. Record the booking fee payment
    const { error: paymentError } = await supabase.from("payments").insert({
      trip_booking_id: bookingId,
      user_id: pending.user_id,
      amount: payment_amount || pending.booking_fee_amount,
      payment_type: "booking_fee",
      status: "completed",
      paid_at: new Date().toISOString(),
      provider_transaction_id: provider_transaction_id || null,
      payment_provider: payment_provider || null,
    });

    if (paymentError) {
      logStep("Error recording payment", { error: paymentError.message });
    } else {
      logStep("Payment recorded");
    }

    // 5. Update booking status to confirmed (payment received)
    await supabase
      .from("trip_bookings")
      .update({ status: "confirmed", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    // 6. Purchase Duffel flight if we have an offer
    let duffelOrderId: string | null = null;
    const { data: duffelTestSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "DUFFEL_TEST_MODE")
      .maybeSingle();
    const isDuffelTestMode = duffelTestSetting?.value === "true";
    const DUFFEL_API_KEY = isDuffelTestMode
      ? Deno.env.get("DUFFEL_TEST_API_KEY")
      : Deno.env.get("DUFFEL_API_KEY");
    logStep("Duffel mode", { testMode: isDuffelTestMode });

    if (pending.duffel_offer_id && DUFFEL_API_KEY) {
      logStep("Purchasing Duffel flight", { offerId: pending.duffel_offer_id });

      try {
        // Build passenger list for Duffel order
        const passengers = travelersInfo.map((t: any, idx: number) => ({
          id: `passenger_${idx}`,
          type: "adult",
          given_name: t.first_name,
          family_name: t.last_name,
          email: t.email,
          phone_number: t.phone,
          born_on: t.birth_date,
          gender: "m", // Duffel requires this but we don't collect it
          title: "mr",
        }));

        // First get the offer to get passenger IDs
        const offerRes = await fetch(`${DUFFEL_API_URL}/air/offers/${pending.duffel_offer_id}`, {
          headers: {
            Authorization: `Bearer ${DUFFEL_API_KEY}`,
            "Duffel-Version": "v2",
            Accept: "application/json",
          },
        });

        if (offerRes.ok) {
          const offerData = await offerRes.json();
          const duffelPassengers = offerData.data?.passengers || [];

          // Map our travelers to Duffel passenger IDs
          const orderPassengers = duffelPassengers.map((dp: any, idx: number) => {
            const t = travelersInfo[idx] || travelersInfo[0];
            return {
              id: dp.id,
              type: "adult",
              given_name: t.first_name,
              family_name: t.last_name,
              email: t.email,
              phone_number: t.phone ? `+46${t.phone.replace(/^0/, "")}` : undefined,
              born_on: t.birth_date,
              gender: "m",
              title: "mr",
            };
          });

          // Create order
          const orderRes = await fetch(`${DUFFEL_API_URL}/air/orders`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${DUFFEL_API_KEY}`,
              "Content-Type": "application/json",
              "Duffel-Version": "v2",
              Accept: "application/json",
            },
            body: JSON.stringify({
              data: {
                type: "instant",
                selected_offers: [pending.duffel_offer_id],
                passengers: orderPassengers,
                payments: [
                  {
                    type: "balance",
                    currency: offerData.data?.total_currency || "EUR",
                    amount: offerData.data?.total_amount || "0",
                  },
                ],
              },
            }),
          });

          if (orderRes.ok) {
            const orderData = await orderRes.json();
            duffelOrderId = orderData.data?.id || null;
            logStep("Duffel order created", { orderId: duffelOrderId });
          } else {
            const errText = await orderRes.text();
            logStep("Duffel order failed", { status: orderRes.status, body: errText.substring(0, 500) });
          }
        } else {
          const errText = await offerRes.text();
          logStep("Duffel offer fetch failed (may have expired)", { status: offerRes.status });
        }
      } catch (duffelError) {
        logStep("Duffel purchase error", { error: String(duffelError) });
      }

      // 7. Store flight info in trip_booking_flights
      const offerData = pending.duffel_offer_data as any;
      if (offerData) {
        const slices = offerData.slices || [];
        const outbound = slices[0] || {};
        const returnFlight = slices[1] || {};

        await supabase.from("trip_booking_flights").insert({
          trip_booking_id: bookingId,
          duffel_order_id: duffelOrderId,
          duffel_offer_id: pending.duffel_offer_id,
          airline: offerData.airline,
          airline_logo: offerData.airline_logo,
          flight_price_sek: pending.flight_price_sek,
          flight_price_original: parseFloat(offerData.total_amount) || null,
          flight_currency_original: offerData.total_currency || "EUR",
          outbound_origin: outbound.origin,
          outbound_destination: outbound.destination,
          outbound_departure_time: outbound.departure_time,
          outbound_arrival_time: outbound.arrival_time,
          outbound_stops: outbound.stops || 0,
          return_origin: returnFlight.origin,
          return_destination: returnFlight.destination,
          return_departure_time: returnFlight.departure_time,
          return_arrival_time: returnFlight.arrival_time,
          return_stops: returnFlight.stops || 0,
          passengers: bookingData.travelers,
        });
        logStep("Flight info stored");
      }
    }

    // 8. Mark pending booking as completed and store actual booking_id
    await supabase
      .from("pending_trip_bookings")
      .update({ status: "completed", booking_id: bookingId })
      .eq("id", pending_booking_id);

    // 9. Send booking confirmation + invite travelers
    try {
      const { data: tripData } = await supabase
        .from("trips")
        .select("name, trip_type, departure_date, return_date")
        .eq("id", pending.trip_id)
        .single();

      if (tripData) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Invite travelers
        await fetch(`${supabaseUrl}/functions/v1/invite-travelers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            travelers: travelersInfo.map((t: any) => ({
              firstName: t.first_name,
              lastName: t.last_name,
              email: t.email,
              phone: t.phone,
            })),
            tripName: tripData.name,
            tripType: tripData.trip_type,
            departureDate: tripData.departure_date,
            returnDate: tripData.return_date,
            bookingId,
            bookerEmail: primaryTraveler.email,
            siteUrl: "https://studentresor.com",
          }),
        });
        logStep("Traveler invitations sent");
      }
    } catch (inviteErr) {
      logStep("Error sending invitations", { error: String(inviteErr) });
    }

    logStep("Booking finalized successfully", { bookingId, duffelOrderId });

    return new Response(
      JSON.stringify({
        success: true,
        booking_id: bookingId,
        duffel_order_id: duffelOrderId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
