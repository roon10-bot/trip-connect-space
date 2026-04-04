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
    const pendingBookingId = params.get("transaction_info[pending_booking_id]") || "";
    const bookingType = params.get("transaction_info[booking_type]") || "";
    const userId = params.get("transaction_info[user_id]") || "";
    const paymentType = params.get("transaction_info[payment_type]") || "altapay_payment";
    const amount = params.get("amount") || "";
    const merchantError = params.get("merchant_error_message") || "";
    const errorMessage = params.get("error_message") || "";

    // Also check XML body if form params are empty (AltaPay sometimes sends XML)
    let xmlStatus = "";
    let xmlTransactionId = "";
    let xmlBookingId = "";
    if (!status && body.includes("<")) {
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
      pendingBookingId,
      bookingType,
      userId,
      paymentType,
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ====== PENDING BOOKING FLOW (booking fee during checkout) ======
    if (pendingBookingId && bookingType === "pending_trip") {
      console.log(`${LOG_PREFIX} Processing PENDING BOOKING payment`, { pendingBookingId, paymentStatus });

      if (paymentStatus === "completed") {
        // Idempotency: check if already finalized
        const { data: pending } = await supabase
          .from("pending_trip_bookings")
          .select("status")
          .eq("id", pendingBookingId)
          .maybeSingle();

        if (pending?.status === "completed") {
          console.log(`${LOG_PREFIX} Pending booking already completed, skipping`);
          return new Response("OK", { status: 200, headers: corsHeaders });
        }

        // Call finalize-trip-booking to create the actual booking
        const parsedAmount = parseFloat(amount) || 0;
        const finalizeRes = await fetch(`${supabaseUrl}/functions/v1/finalize-trip-booking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            pending_booking_id: pendingBookingId,
            payment_amount: parsedAmount,
            payment_provider: "altapay",
            provider_transaction_id: finalTransactionId,
          }),
        });

        const finalizeData = await finalizeRes.json();
        if (finalizeData.error) {
          console.error(`${LOG_PREFIX} Finalize error:`, finalizeData.error);
        } else {
          console.log(`${LOG_PREFIX} Booking finalized:`, finalizeData);
        }
      } else if (paymentStatus === "failed") {
        await supabase
          .from("pending_trip_bookings")
          .update({ status: "payment_failed" })
          .eq("id", pendingBookingId);
        console.log(`${LOG_PREFIX} Pending booking marked as payment_failed`);
      }

      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // ====== EXISTING BOOKING FLOW (subsequent payments from dashboard) ======
    if (paymentStatus && bookingId) {
      if (paymentStatus === "completed") {
        // === IDEMPOTENCY CHECK ===
        if (finalTransactionId) {
          const { data: existing } = await supabase
            .from("payments")
            .select("id")
            .eq("provider_transaction_id", finalTransactionId)
            .maybeSingle();

          if (existing) {
            console.log(`${LOG_PREFIX} DUPLICATE: Payment for transaction ${finalTransactionId} already exists (${existing.id}), skipping`);
            return new Response("OK", { status: 200, headers: corsHeaders });
          }
        }

        // === AMOUNT VALIDATION ===
        const parsedAmount = parseFloat(amount) || 0;
        if (parsedAmount <= 0) {
          console.error(`${LOG_PREFIX} Invalid amount: ${amount}`);
          return new Response("OK", { status: 200, headers: corsHeaders });
        }

        // Verify amount against booking
        const { data: booking } = await supabase
          .from("trip_bookings")
          .select("total_price")
          .eq("id", bookingId)
          .maybeSingle();

        if (booking) {
          const totalPrice = Number(booking.total_price);
          if (parsedAmount > totalPrice) {
            console.error(`${LOG_PREFIX} AMOUNT MISMATCH: callback amount ${parsedAmount} exceeds booking total ${totalPrice} for booking ${bookingId}`);
          }
        }

        // Create the payment record with correct payment_type
        const { error: insertError } = await supabase
          .from("payments")
          .insert({
            trip_booking_id: bookingId,
            user_id: userId || null,
            amount: parsedAmount,
            payment_type: paymentType,
            status: "completed",
            paid_at: new Date().toISOString(),
            provider_transaction_id: finalTransactionId || null,
            payment_provider: "altapay",
          });

        if (insertError) {
          console.error(`${LOG_PREFIX} Error inserting completed payment:`, insertError);
        } else {
          console.log(`${LOG_PREFIX} Payment created as completed for booking ${bookingId}, amount ${parsedAmount}, type ${paymentType}, txn ${finalTransactionId}`);

          // Send payment confirmation email
          try {
            const { data: bookingData } = await supabase
              .from("trip_bookings")
              .select("first_name, email, total_price, trips(name, departure_date, return_date)")
              .eq("id", bookingId)
              .maybeSingle();

            if (bookingData) {
              const trip = bookingData.trips as any;
              const siteUrl = "https://studentresor.com";

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
                    amount: String(parsedAmount),
                    total_price: String(bookingData.total_price),
                  },
                  action_url: `${siteUrl}/dashboard`,
                }),
              });
              console.log(`${LOG_PREFIX} Payment confirmation email sent to ${bookingData.email}`);
            }
          } catch (emailErr) {
            console.error(`${LOG_PREFIX} Failed to send payment confirmation email:`, emailErr);
          }
        }

        // Confirm the booking if still pending
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
      } else {
        console.log(`${LOG_PREFIX} Non-completed status ${paymentStatus} for booking ${bookingId}, no payment record created`);
      }
    } else if (!pendingBookingId) {
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
