import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOG_PREFIX = "[ALTAPAY-NOTIFICATION]";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log(`${LOG_PREFIX} Received body length: ${body.length}`);
    console.log(`${LOG_PREFIX} Body preview: ${body.substring(0, 2000)}`);

    // AltaPay sends callbacks as form-encoded data
    const params = new URLSearchParams(body);

    // Extract key fields from the callback
    const shopOrderId = params.get("shop_orderid") || "";
    const status = params.get("status") || params.get("payment_status") || "";
    const transactionId = params.get("transaction_id") || "";
    const bookingId = params.get("transaction_info[booking_id]") || "";
    const bookingType = params.get("transaction_info[booking_type]") || "";
    const userId = params.get("transaction_info[user_id]") || "";
    const amount = params.get("amount") || "";
    const merchantError = params.get("merchant_error_message") || "";
    const errorMessage = params.get("error_message") || "";

    // Also check XML body if form params are empty (AltaPay sometimes sends XML)
    let xmlStatus = "";
    let xmlTransactionId = "";
    let xmlBookingId = "";
    if (!status && body.includes("<")) {
      // Simple XML extraction
      const statusMatch = body.match(/<TransactionStatus>([^<]+)<\/TransactionStatus>/);
      const txnMatch = body.match(/<TransactionId>([^<]+)<\/TransactionId>/);
      const shopMatch = body.match(/<ShopOrderId>([^<]+)<\/ShopOrderId>/);
      xmlStatus = statusMatch?.[1] || "";
      xmlTransactionId = txnMatch?.[1] || "";
      xmlBookingId = shopMatch?.[1] || "";
    }

    const finalStatus = status || xmlStatus;
    const finalTransactionId = transactionId || xmlTransactionId;
    const finalShopOrderId = shopOrderId || xmlBookingId;

    console.log(`${LOG_PREFIX} Parsed:`, JSON.stringify({
      shopOrderId: finalShopOrderId,
      status: finalStatus,
      transactionId: finalTransactionId,
      bookingId,
      bookingType,
      userId,
      amount,
      merchantError,
      errorMessage,
    }));

    // Map AltaPay status to our payment status
    let paymentStatus: string | null = null;
    const normalizedStatus = finalStatus.toLowerCase();
    if (
      normalizedStatus === "captured" ||
      normalizedStatus === "bank_payment_finalized" ||
      normalizedStatus === "succeeded"
    ) {
      paymentStatus = "completed";
    } else if (
      normalizedStatus === "failed" ||
      normalizedStatus === "error" ||
      normalizedStatus === "cancelled" ||
      normalizedStatus === "chargebacked"
    ) {
      paymentStatus = "failed";
    } else if (
      normalizedStatus === "preauth" ||
      normalizedStatus === "recurring_confirmed"
    ) {
      paymentStatus = "pending";
    }

    console.log(`${LOG_PREFIX} Mapped status: ${finalStatus} -> ${paymentStatus}`);

    if (paymentStatus && bookingId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find the most recent pending payment for this booking
      const { data: existingPayment, error: findError } = await supabase
        .from("payments")
        .select("id, status")
        .eq("trip_booking_id", bookingId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findError) {
        console.error(`${LOG_PREFIX} Error finding payment:`, findError);
      }

      if (existingPayment) {
        const updateData: Record<string, unknown> = {
          status: paymentStatus,
          updated_at: new Date().toISOString(),
        };
        if (paymentStatus === "completed") {
          updateData.paid_at = new Date().toISOString();
        }
        if (finalTransactionId) {
          updateData.stripe_payment_intent_id = finalTransactionId; // reuse field for AltaPay txn ID
        }

        const { error: updateError } = await supabase
          .from("payments")
          .update(updateData)
          .eq("id", existingPayment.id);

        if (updateError) {
          console.error(`${LOG_PREFIX} Error updating payment:`, updateError);
        } else {
          console.log(`${LOG_PREFIX} Payment ${existingPayment.id} updated to ${paymentStatus}`);
        }

        // If payment completed, confirm the booking
        if (paymentStatus === "completed") {
          const { error: bookingError } = await supabase
            .from("trip_bookings")
            .update({ status: "confirmed", updated_at: new Date().toISOString() })
            .eq("id", bookingId)
            .eq("status", "pending");

          if (bookingError) {
            console.error(`${LOG_PREFIX} Error confirming booking:`, bookingError);
          } else {
            console.log(`${LOG_PREFIX} Booking ${bookingId} confirmed`);
          }
        }
      } else {
        console.log(`${LOG_PREFIX} No pending payment found for booking ${bookingId}`);
      }
    } else {
      console.log(`${LOG_PREFIX} Skipping DB update - paymentStatus: ${paymentStatus}, bookingId: ${bookingId}`);
    }

    // Always return 200 to AltaPay
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error);
    // Always return 200 to prevent AltaPay retries on our errors
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
