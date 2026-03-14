import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header found");
    }
    logStep("Signature found");

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      logStep("Signature verification failed");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Signature verified", { eventType: event.type });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed");

      const bookingId = session.metadata?.booking_id;
      const bookingType = session.metadata?.booking_type;
      const userId = session.metadata?.user_id;

      if (!bookingId) {
        logStep("No booking_id in metadata, skipping");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amountPaid = (session.amount_total || 0) / 100;
      logStep("Payment details", { bookingType, amountPaid });

      let paymentType = "first_payment";
      
      if (bookingType === "trip") {
        const { data: existingPayments, error: paymentsError } = await supabaseClient
          .from("payments")
          .select("payment_type")
          .eq("trip_booking_id", bookingId)
          .eq("status", "completed")
          .order("created_at", { ascending: true });

        if (paymentsError) {
          logStep("Error fetching existing payments");
        } else if (existingPayments && existingPayments.length > 0) {
          const paidTypes = existingPayments.map(p => p.payment_type);
          if (!paidTypes.includes("first_payment")) {
            paymentType = "first_payment";
          } else if (!paidTypes.includes("second_payment")) {
            paymentType = "second_payment";
          } else {
            paymentType = "final_payment";
          }
        }
        logStep("Determined payment type", { paymentType, existingCount: existingPayments?.length || 0 });

        const { error: insertError } = await supabaseClient
          .from("payments")
          .insert({
            trip_booking_id: bookingId,
            user_id: userId,
            amount: amountPaid,
            payment_type: paymentType,
            status: "completed",
            paid_at: new Date().toISOString(),
            provider_session_id: session.id,
            provider_transaction_id: typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent?.id || null,
            payment_provider: "stripe",
          });

        if (insertError) {
          logStep("Error inserting payment");
          throw new Error("Failed to insert payment");
        }
        logStep("Payment record inserted successfully");

        const { data: tripBooking } = await supabaseClient
          .from("trip_bookings")
          .select("*, trips(*)")
          .eq("id", bookingId)
          .maybeSingle();

        if (tripBooking) {
          await supabaseClient
            .from("trip_bookings")
            .update({ status: "confirmed" })
            .eq("id", bookingId);
          logStep("Trip booking marked as confirmed");

          try {
            const tripData = tripBooking.trips as { name?: string; departure_date?: string; return_date?: string } | null;
            const siteUrl = "https://studentresor.com";

            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                template_key: "payment_confirmation",
                to_email: tripBooking.email,
                variables: {
                  first_name: tripBooking.first_name,
                  trip_name: tripData?.name || "",
                  departure_date: tripData?.departure_date || "",
                  return_date: tripData?.return_date || "",
                  amount: String(amountPaid),
                },
                action_url: `${siteUrl}/dashboard`,
              }),
            });
            logStep("Payment confirmation email sent");
          } catch (emailErr) {
            logStep("Failed to send payment email");
          }
        }
      } else {
        const { error: updateError } = await supabaseClient
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", bookingId);

        if (updateError) {
          logStep("Error updating booking status");
        } else {
          logStep("Booking status updated to confirmed");
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      logStep("Checkout session expired (no action needed)");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR");
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
