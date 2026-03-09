import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-+()]{6,20}$/;

// --- Rate Limiting ---
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_MEETINGS_PER_IP = 5; // max meeting bookings per IP per hour

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

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
    // Rate limit by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ipRateMap, clientIp, MAX_MEETINGS_PER_IP)) {
      return new Response(JSON.stringify({ error: "Too many booking attempts. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { slot_id, first_name, last_name, email, phone, school, message } = body;

    // Validate required fields
    const errors: string[] = [];

    if (!slot_id || typeof slot_id !== "string") errors.push("slot_id is required");
    if (!first_name || typeof first_name !== "string" || first_name.trim().length === 0 || first_name.length > 100)
      errors.push("first_name is required and must be under 100 characters");
    if (!last_name || typeof last_name !== "string" || last_name.trim().length === 0 || last_name.length > 100)
      errors.push("last_name is required and must be under 100 characters");
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email) || email.length > 255)
      errors.push("A valid email is required");
    if (!phone || typeof phone !== "string" || !PHONE_REGEX.test(phone))
      errors.push("A valid phone number is required");
    if (!school || typeof school !== "string" || school.trim().length === 0 || school.length > 200)
      errors.push("school is required and must be under 200 characters");
    if (message && (typeof message !== "string" || message.length > 1000))
      errors.push("message must be under 1000 characters");

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the slot exists and is not booked
    const { data: slot, error: slotError } = await supabaseAdmin
      .from("meeting_slots")
      .select("id, is_booked, slot_date")
      .eq("id", slot_id)
      .maybeSingle();

    if (slotError || !slot) {
      return new Response(JSON.stringify({ error: "Slot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (slot.is_booked) {
      return new Response(JSON.stringify({ error: "This slot is already booked" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check the slot date is not in the past
    if (new Date(slot.slot_date) < new Date(new Date().toISOString().split("T")[0])) {
      return new Response(JSON.stringify({ error: "Cannot book a slot in the past" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the booking
    const { error: bookingError } = await supabaseAdmin
      .from("meeting_bookings")
      .insert({
        slot_id,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        school: school.trim(),
        message: message?.trim() || null,
      });

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      throw new Error("Failed to create booking");
    }

    // Mark slot as booked
    await supabaseAdmin
      .from("meeting_slots")
      .update({ is_booked: true })
      .eq("id", slot_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-meeting-booking:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
