import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    logStep("Secrets verified");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }
    logStep("Signature found");

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Signature verified", { eventType: event.type });

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        metadata: session.metadata,
      });

      const bookingId = session.metadata?.booking_id;
      const bookingType = session.metadata?.booking_type;
      const userId = session.metadata?.user_id;

      if (!bookingId) {
        logStep("No booking_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amountPaid = (session.amount_total || 0) / 100; // Convert from öre to SEK
      logStep("Payment details", { bookingId, bookingType, amountPaid, userId });

      // Determine payment type based on existing payments for this booking
      let paymentType = "first_payment";
      
      if (bookingType === "trip") {
        // Check existing payments for this trip booking
        const { data: existingPayments, error: paymentsError } = await supabaseClient
          .from("payments")
          .select("payment_type")
          .eq("trip_booking_id", bookingId)
          .eq("status", "completed")
          .order("created_at", { ascending: true });

        if (paymentsError) {
          logStep("Error fetching existing payments", { error: paymentsError.message });
        } else if (existingPayments && existingPayments.length > 0) {
          // Determine next payment type based on what's already paid
          const paidTypes = existingPayments.map(p => p.payment_type);
          if (!paidTypes.includes("first_payment")) {
            paymentType = "first_payment";
          } else if (!paidTypes.includes("second_payment")) {
            paymentType = "second_payment";
          } else {
            paymentType = "final_payment";
          }
        }
        logStep("Determined payment type", { paymentType, existingPayments: existingPayments?.length || 0 });

        // Insert payment record
        const { error: insertError } = await supabaseClient
          .from("payments")
          .insert({
            trip_booking_id: bookingId,
            user_id: userId,
            amount: amountPaid,
            payment_type: paymentType,
            status: "completed",
            paid_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent?.id || null,
          });

        if (insertError) {
          logStep("Error inserting payment", { error: insertError.message });
          throw new Error(`Failed to insert payment: ${insertError.message}`);
        }
        logStep("Payment record inserted successfully");

        // Update trip booking status if fully paid
        const { data: tripBooking } = await supabaseClient
          .from("trip_bookings")
          .select("*, trips(*)")
          .eq("id", bookingId)
          .maybeSingle();

        if (tripBooking) {
          const { data: allPayments } = await supabaseClient
            .from("payments")
            .select("amount")
            .eq("trip_booking_id", bookingId)
            .eq("status", "completed");

          const totalPaid = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const totalPrice = tripBooking.total_price;

          if (totalPaid >= totalPrice) {
            await supabaseClient
              .from("trip_bookings")
              .update({ status: "paid" })
              .eq("id", bookingId);
            logStep("Trip booking marked as fully paid");
          } else {
            await supabaseClient
              .from("trip_bookings")
              .update({ status: "partial_payment" })
              .eq("id", bookingId);
            logStep("Trip booking marked as partial payment", { totalPaid, totalPrice });
          }
        }
      } else {
        // Handle legacy destination bookings
        const { error: updateError } = await supabaseClient
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId);

        if (updateError) {
          logStep("Error updating booking status", { error: updateError.message });
        } else {
          logStep("Booking status updated to confirmed");
        }
      }
    }

    // Send cancellation email when booking is cancelled
    if (event.type === "checkout.session.expired") {
      logStep("Checkout session expired (no action needed)");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
