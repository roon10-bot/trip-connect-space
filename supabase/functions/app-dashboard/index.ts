import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub;
  const userEmail = claimsData.claims.email as string;

  try {
    // Fetch trip bookings accessible to this user (RLS handles access)
    const { data: tripBookings, error: tbErr } = await supabase
      .from("trip_bookings")
      .select(`
        id, total_price, travelers, user_id, departure_location,
        trips (
          name, trip_type, departure_date, return_date,
          first_payment_amount, first_payment_type, first_payment_date,
          second_payment_amount, second_payment_type, second_payment_date,
          final_payment_amount, final_payment_type, final_payment_date
        )
      `)
      .order("created_at", { ascending: false });

    if (tbErr) throw tbErr;

    if (!tripBookings || tripBookings.length === 0) {
      return new Response(
        JSON.stringify({
          tripName: null,
          tripDates: null,
          departure: null,
          nextPaymentAmount: null,
          nextPaymentCurrency: "SEK",
          nextPaymentDueDate: null,
          portalUrl: "https://www.studentresor.com/dashboard",
          paymentsUrl: "https://www.studentresor.com/dashboard?tab=payments",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick the most relevant booking (next upcoming departure)
    const now = new Date();
    const upcoming = tripBookings
      .filter((b: any) => b.trips?.departure_date && new Date(b.trips.departure_date) > now)
      .sort((a: any, b: any) => new Date(a.trips.departure_date).getTime() - new Date(b.trips.departure_date).getTime());
    const activeBooking = upcoming[0] || tripBookings[0];
    const trip = activeBooking.trips as any;

    // Format trip type
    const typeMap: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    const tripName = `${trip.name} – ${typeMap[trip.trip_type] || trip.trip_type}`;

    // Format dates
    const fmtDate = (d: string) => {
      const date = new Date(d);
      const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    };
    const fmtDateFull = (d: string) => {
      const date = new Date(d);
      const months = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };
    const tripDates = `${fmtDate(trip.departure_date)} – ${fmtDateFull(trip.return_date)}`;

    // Fetch completed payments for this booking
    const { data: payments } = await supabase
      .from("payments")
      .select("payment_type, status, amount")
      .eq("trip_booking_id", activeBooking.id)
      .eq("status", "completed");

    const paidTypes = new Set((payments || []).map((p: any) => p.payment_type));

    // Calculate next payment
    const isBooker = activeBooking.user_id === userId;
    const totalPrice = isBooker
      ? Number(activeBooking.total_price)
      : Math.ceil(Number(activeBooking.total_price) / (activeBooking.travelers || 1));

    const calcAmount = (amt: number, type: string, total: number) =>
      type === "percent" ? Math.ceil((amt / 100) * total) : amt;

    const plan = [
      { type: "first_payment", amount: trip.first_payment_amount || 0, payType: trip.first_payment_type || "amount", date: trip.first_payment_date },
      { type: "second_payment", amount: trip.second_payment_amount || 0, payType: trip.second_payment_type || "amount", date: trip.second_payment_date },
      { type: "final_payment", amount: trip.final_payment_amount || 0, payType: trip.final_payment_type || "amount", date: trip.final_payment_date },
    ];

    let nextPaymentAmount: number | null = null;
    let nextPaymentDueDate: string | null = null;

    for (const p of plan) {
      if (p.amount > 0 && !paidTypes.has(p.type)) {
        nextPaymentAmount = calcAmount(p.amount, p.payType, totalPrice);
        nextPaymentDueDate = p.date || null;
        break;
      }
    }

    return new Response(
      JSON.stringify({
        tripName,
        tripDates,
        departure: activeBooking.departure_location,
        nextPaymentAmount,
        nextPaymentCurrency: "SEK",
        nextPaymentDueDate,
        portalUrl: "https://www.studentresor.com/dashboard",
        paymentsUrl: "https://www.studentresor.com/dashboard?tab=payments",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
