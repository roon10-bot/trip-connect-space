import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiryThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Find pending bookings older than 48h without any paid payment
    const { data: pendingBookings, error: fetchError } = await supabaseAdmin
      .from("trip_bookings")
      .select("id, trip_id, travelers, status")
      .eq("status", "pending")
      .lt("created_at", expiryThreshold);

    if (fetchError) {
      console.error("Failed to fetch pending bookings");
      throw fetchError;
    }

    if (!pendingBookings || pendingBookings.length === 0) {
      console.log("No pending bookings to expire");
      // Cleanup rate limit log
      await supabaseAdmin.rpc("cleanup_rate_limit_log");
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let expiredCount = 0;
    const affectedTrips = new Set<string>();

    for (const booking of pendingBookings) {
      // Check if booking has any paid payment
      const { data: paidPayments } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("trip_booking_id", booking.id)
        .eq("status", "paid")
        .limit(1);

      if (paidPayments && paidPayments.length > 0) continue;

      // Expire the booking
      const { error: updateError } = await supabaseAdmin
        .from("trip_bookings")
        .update({ status: "expired" })
        .eq("id", booking.id);

      if (updateError) {
        console.error("Failed to expire a booking");
        continue;
      }

      expiredCount++;
      affectedTrips.add(booking.trip_id);

      // Log to activity log
      await supabaseAdmin.from("booking_activity_log").insert({
        trip_booking_id: booking.id,
        activity_type: "status_change",
        description: "Bokning automatiskt förfallen efter 48h utan betalning",
        metadata: {
          old_status: "pending",
          new_status: "expired",
          reason: "auto_expire_48h",
          travelers: booking.travelers,
        },
      });
    }

    // Recalculate capacity for affected trips
    for (const tripId of affectedTrips) {
      const { data: trip } = await supabaseAdmin
        .from("trips")
        .select("id, capacity, is_fullbooked")
        .eq("id", tripId)
        .maybeSingle();

      if (!trip || !trip.is_fullbooked) continue;

      const { data: activeBookings } = await supabaseAdmin
        .from("trip_bookings")
        .select("travelers")
        .eq("trip_id", tripId)
        .in("status", ["pending", "preliminary", "confirmed"]);

      const totalTravelers = (activeBookings || []).reduce(
        (sum: number, b: { travelers: number }) => sum + b.travelers, 0
      );

      if (totalTravelers < trip.capacity) {
        await supabaseAdmin
          .from("trips")
          .update({ is_fullbooked: false })
          .eq("id", tripId);
        console.log(`Trip capacity restored (active travelers: ${totalTravelers}/${trip.capacity})`);
      }
    }

    // Cleanup old rate limit logs
    await supabaseAdmin.rpc("cleanup_rate_limit_log");

    console.log(`Expired ${expiredCount} bookings`);
    return new Response(JSON.stringify({ expired: expiredCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in expire-pending-bookings");
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
