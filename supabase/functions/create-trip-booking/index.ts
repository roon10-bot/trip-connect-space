import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{6,20}$/;
const VALID_DEPARTURES = ["ARN", "GOT", "CPH", "Arlanda (ARN)", "Landvetter (GOT)", "Kastrup (CPH)"];

// --- Rate Limiting ---
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BOOKINGS_PER_USER = 5; // max bookings per user per hour
const MAX_BOOKINGS_PER_IP = 10; // max bookings per IP per hour

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const userRateMap = new Map<string, RateLimitEntry>();
const ipRateMap = new Map<string, RateLimitEntry>();

function isRateLimited(map: Map<string, RateLimitEntry>, key: string, max: number): boolean {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= max) {
    return true;
  }

  entry.count++;
  return false;
}

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userRateMap) {
    if (now > entry.resetAt) userRateMap.delete(key);
  }
  for (const [key, entry] of ipRateMap) {
    if (now > entry.resetAt) ipRateMap.delete(key);
  }
}, 10 * 60 * 1000);

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

    // Rate limit by user ID
    if (isRateLimited(userRateMap, user.id, MAX_BOOKINGS_PER_USER)) {
      return new Response(JSON.stringify({ error: "Too many booking attempts. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ipRateMap, clientIp, MAX_BOOKINGS_PER_IP)) {
      return new Response(JSON.stringify({ error: "Too many requests from this address. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.error("Booking insert failed");
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
      console.error("Travelers insert failed");
      // Don't fail the whole booking
    }

    // Send booking confirmation email (fire-and-forget)
    try {
      const { data: tripData } = await supabaseAdmin
        .from("trips")
        .select("name, departure_date, return_date, partner_listing_id")
        .eq("id", trip_id)
        .maybeSingle();

      if (tripData) {
        const siteUrl = "https://studentresor.com";

        // Send confirmation to customer
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            template_key: "booking_confirmation",
            to_email: (primary.email as string).trim().toLowerCase(),
            variables: {
              first_name: (primary.first_name as string).trim(),
              trip_name: tripData.name,
              departure_date: tripData.departure_date,
              return_date: tripData.return_date,
              travelers: String(travelers),
              total_price: String(total_price),
            },
            action_url: `${siteUrl}/dashboard`,
          }),
        });

        // Send notification to host if trip is linked to a partner listing
        if (tripData.partner_listing_id) {
          try {
            const { data: listing } = await supabaseAdmin
              .from("partner_listings")
              .select("name, partner_id")
              .eq("id", tripData.partner_listing_id)
              .maybeSingle();

            if (listing) {
              const { data: partner } = await supabaseAdmin
                .from("partner_profiles")
                .select("email, first_name, last_name, contact_person, company_name")
                .eq("id", listing.partner_id)
                .maybeSingle();

              if (partner) {
                const hostName = partner.contact_person || partner.first_name || partner.company_name || "Värd";

                await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    template_key: "host_booking_notification",
                    to_email: partner.email,
                    variables: {
                      host_name: hostName,
                      listing_name: listing.name,
                      trip_name: tripData.name,
                      departure_date: tripData.departure_date,
                      return_date: tripData.return_date,
                      travelers: String(travelers),
                    },
                    action_url: `${siteUrl}/partner`,
                  }),
                });

                console.log(`[CREATE-TRIP-BOOKING] Host notification sent to ${partner.email}`);
              }
            }
          } catch (hostEmailErr) {
            console.error("Failed to send host booking notification email:", hostEmailErr);
          }
        }
      }
    } catch (emailErr) {
      console.error("Failed to send booking confirmation email");
    }

    return new Response(JSON.stringify({ success: true, booking_id: booking.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-trip-booking");
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
