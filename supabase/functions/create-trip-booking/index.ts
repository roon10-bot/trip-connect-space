import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{6,20}$/;
const VALID_DEPARTURES = ["ARN", "GOT", "CPH"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    const body = await req.json();
    const { trip_id, travelers, discount_code, discount_amount, total_price, travelers_info } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!trip_id || typeof trip_id !== "string") errors.push("trip_id is required");
    if (!travelers || typeof travelers !== "number" || travelers < 1 || travelers > 50) errors.push("travelers must be between 1 and 50");
    if (typeof total_price !== "number" || total_price < 0) errors.push("total_price must be a non-negative number");
    
    if (!Array.isArray(travelers_info) || travelers_info.length === 0) {
      errors.push("travelers_info is required");
    } else if (travelers_info.length !== travelers) {
      errors.push("travelers_info length must match travelers count");
    } else {
      travelers_info.forEach((t: Record<string, unknown>, i: number) => {
        const label = `Traveler ${i + 1}`;
        if (!t.first_name || typeof t.first_name !== "string" || (t.first_name as string).trim().length === 0 || (t.first_name as string).length > 100)
          errors.push(`${label}: first_name is required (max 100 chars)`);
        if (!t.last_name || typeof t.last_name !== "string" || (t.last_name as string).trim().length === 0 || (t.last_name as string).length > 100)
          errors.push(`${label}: last_name is required (max 100 chars)`);
        if (!t.email || typeof t.email !== "string" || !EMAIL_REGEX.test(t.email as string) || (t.email as string).length > 255)
          errors.push(`${label}: valid email is required`);
        if (!t.phone || typeof t.phone !== "string" || !PHONE_REGEX.test(t.phone as string))
          errors.push(`${label}: valid phone is required`);
        if (!t.birth_date || typeof t.birth_date !== "string")
          errors.push(`${label}: birth_date is required`);
        if (!t.departure_location || typeof t.departure_location !== "string" || !VALID_DEPARTURES.includes(t.departure_location as string))
          errors.push(`${label}: departure_location must be one of ${VALID_DEPARTURES.join(", ")}`);
      });
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify trip exists and is active
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .select("id, is_active, is_fullbooked, capacity")
      .eq("id", trip_id)
      .maybeSingle();

    if (tripError || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!trip.is_active) {
      return new Response(JSON.stringify({ error: "Trip is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trip.is_fullbooked) {
      return new Response(JSON.stringify({ error: "Trip is fully booked" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const primary = travelers_info[0];

    // Insert main booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("trip_bookings")
      .insert({
        trip_id,
        user_id: user.id,
        first_name: (primary.first_name as string).trim(),
        last_name: (primary.last_name as string).trim(),
        email: (primary.email as string).trim().toLowerCase(),
        birth_date: primary.birth_date,
        phone: (primary.phone as string).trim(),
        departure_location: primary.departure_location,
        travelers,
        total_price,
        discount_code: discount_code || null,
        discount_amount: discount_amount || 0,
        status: "pending",
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      throw new Error("Failed to create booking");
    }

    // Insert all travelers
    const travelerRows = travelers_info.map((t: Record<string, unknown>, index: number) => ({
      trip_booking_id: booking.id,
      traveler_index: index,
      first_name: (t.first_name as string).trim(),
      last_name: (t.last_name as string).trim(),
      email: (t.email as string).trim().toLowerCase(),
      birth_date: t.birth_date,
      phone: (t.phone as string).trim(),
      departure_location: t.departure_location,
    }));

    const { error: travelersError } = await supabaseAdmin
      .from("trip_booking_travelers")
      .insert(travelerRows);

    if (travelersError) {
      console.error("Travelers insert error:", travelersError);
      // Don't fail the whole booking
    }

    return new Response(JSON.stringify({ success: true, booking_id: booking.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-trip-booking:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
