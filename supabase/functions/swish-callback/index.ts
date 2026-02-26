import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SWISH-CALLBACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Callback received", { method: req.method });

    const body = await req.json();
    logStep("Callback payload", body);

    const {
      id: swishPaymentId,
      payeePaymentReference,
      status,
      amount,
      currency,
      datePaid,
      errorCode,
      errorMessage,
      payerAlias,
    } = body;

    if (!swishPaymentId) {
      throw new Error("Missing payment ID in callback");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the pending payment by Swish payment ID
    // We stored it in stripe_payment_intent_id column
    const { data: payment, error: findError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent_id", swishPaymentId)
      .maybeSingle();

    if (findError || !payment) {
      logStep("Payment not found", { swishPaymentId, error: findError?.message });
      // Return 200 to Swish so they don't retry
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Payment found", { paymentId: payment.id, currentStatus: payment.status });

    if (status === "PAID") {
      // Update payment to completed
      await supabaseClient
        .from("payments")
        .update({
          status: "completed",
          paid_at: datePaid || new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Update booking status if needed
      const { data: allPayments } = await supabaseClient
        .from("payments")
        .select("amount, status")
        .eq("trip_booking_id", payment.trip_booking_id);

      const totalPaid = (allPayments || [])
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      const { data: booking } = await supabaseClient
        .from("trip_bookings")
        .select("total_price, status")
        .eq("id", payment.trip_booking_id)
        .maybeSingle();

      if (booking && totalPaid >= booking.total_price && booking.status !== "confirmed") {
        await supabaseClient
          .from("trip_bookings")
          .update({ status: "confirmed" })
          .eq("id", payment.trip_booking_id);
        logStep("Booking status updated to confirmed");
      }

      // Send payment confirmation email
      try {
        const { data: bookingData } = await supabaseClient
          .from("trip_bookings")
          .select("first_name, email, total_price, trips(name, departure_date, return_date)")
          .eq("id", payment.trip_booking_id)
          .maybeSingle();

        if (bookingData) {
          const trip = bookingData.trips as any;
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              template_key: "payment_confirmation",
              to_email: bookingData.email,
              variables: {
                first_name: bookingData.first_name,
                trip_name: trip?.name || "",
                departure_date: trip?.departure_date || "",
                return_date: trip?.return_date || "",
                amount: String(amount),
                total_price: String(bookingData.total_price),
              },
              action_url: "https://studentresor.com/dashboard",
            }),
          });
          logStep("Payment confirmation email sent", { to: bookingData.email });
        }
      } catch (emailErr) {
        logStep("Failed to send payment confirmation email", { error: String(emailErr) });
      }

      logStep("Payment completed", { paymentId: payment.id, totalPaid });
    } else if (status === "DECLINED" || status === "ERROR") {
      await supabaseClient
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      logStep("Payment failed", { status, errorCode, errorMessage });
    } else {
      logStep("Unhandled status", { status });
    }

    // Always return 200 to Swish
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Return 200 anyway to prevent Swish retries
    return new Response(JSON.stringify({ received: true, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
