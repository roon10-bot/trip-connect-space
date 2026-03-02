import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DUFFEL_API_URL = "https://api.duffel.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
    if (!DUFFEL_API_KEY) {
      throw new Error("DUFFEL_API_KEY is not configured");
    }

    const { origin, destination, departure_date, return_date, passengers } = await req.json();

    if (!origin || !destination || !departure_date) {
      return new Response(
        JSON.stringify({ error: "origin, destination, and departure_date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Create an offer request (round-trip if return_date provided)
    const slices: any[] = [
      { origin, destination, departure_date },
    ];
    if (return_date) {
      slices.push({ origin: destination, destination: origin, departure_date: return_date });
    }

    const offerRequestBody = {
      data: {
        slices,
        passengers: Array.from({ length: passengers || 1 }, () => ({ type: "adult" })),
        cabin_class: "economy",
      },
    };

    console.log("Creating Duffel offer request:", JSON.stringify(offerRequestBody));

    const offerRes = await fetch(`${DUFFEL_API_URL}/air/offer_requests`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUFFEL_API_KEY}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        Accept: "application/json",
      },
      body: JSON.stringify(offerRequestBody),
    });

    if (!offerRes.ok) {
      const errBody = await offerRes.text();
      console.error(`Duffel offer_requests failed [${offerRes.status}]:`, errBody);
      throw new Error(`Duffel API error [${offerRes.status}]: ${errBody}`);
    }

    const offerData = await offerRes.json();
    const offers = offerData.data?.offers || [];

    // Fetch EUR→SEK exchange rate
    let eurToSek = 11.50; // fallback
    try {
      const fxRes = await fetch("https://api.frankfurter.dev/v1/latest?from=EUR&to=SEK");
      if (fxRes.ok) {
        const fxData = await fxRes.json();
        eurToSek = fxData.rates?.SEK || eurToSek;
      }
    } catch (e) {
      console.warn("Failed to fetch exchange rate, using fallback:", eurToSek);
    }

    // Return the cheapest offers (up to 5)
    const sortedOffers = offers
      .sort((a: any, b: any) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
      .slice(0, 5);

    const simplifiedOffers = sortedOffers.map((offer: any) => {
      const totalOriginal = parseFloat(offer.total_amount);
      const currency = offer.total_currency || "EUR";
      const conversionRate = currency === "SEK" ? 1 : eurToSek;
      const totalSek = totalOriginal * conversionRate;
      const perPassengerSek = totalSek / (passengers || 1);

      return {
        id: offer.id,
        total_amount_original: offer.total_amount,
        total_currency_original: currency,
        total_amount_sek: totalSek.toFixed(2),
        price_per_passenger_sek: perPassengerSek.toFixed(2),
        airline: offer.owner?.name || "Unknown",
        airline_logo: offer.owner?.logo_symbol_url || null,
        slices: offer.slices?.map((slice: any) => ({
          origin: slice.origin?.iata_code,
          origin_name: slice.origin?.name,
          destination: slice.destination?.iata_code,
          destination_name: slice.destination?.name,
          departure_time: slice.segments?.[0]?.departing_at,
          arrival_time: slice.segments?.[slice.segments.length - 1]?.arriving_at,
          duration: slice.duration,
          stops: (slice.segments?.length || 1) - 1,
        })),
      };
    });

    return new Response(
      JSON.stringify({
        offers: simplifiedOffers,
        total_offers: offers.length,
        exchange_rate: eurToSek,
        is_test: DUFFEL_API_KEY.startsWith("duffel_test"),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-flights:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
