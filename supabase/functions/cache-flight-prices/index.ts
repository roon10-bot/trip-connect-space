// cache-flight-prices Edge Function v2
// Hämtar flygpriser från Duffel och cachar ALLA erbjudanden
// Körs varje timme via pg_cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Destination är alltid Split för nu
const DESTINATION_IATA = "SPU";

// EUR till SEK växelkurs (uppdatera vid behov eller hämta dynamiskt)
const EUR_TO_SEK = 11.5;

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  expires_at: string;
  owner: {
    name: string;
    iata_code?: string;
    logo_symbol_url?: string;
  };
  slices: Array<{
    origin: { iata_code: string };
    destination: { iata_code: string };
    duration: string; // ISO 8601 duration, e.g. "PT2H15M"
    segments: Array<{
      departing_at: string;
      arriving_at: string;
      origin: { iata_code: string };
      destination: { iata_code: string };
      marketing_carrier: {
        name: string;
        iata_code: string;
        logo_symbol_url?: string;
      };
    }>;
  }>;
  passengers: Array<{
    baggages: Array<{
      type: string; // "carry_on" or "checked"
      quantity: number;
    }>;
  }>;
  total_emissions_kg?: string;
}

// Konvertera ISO 8601 duration till minuter
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const duffelApiKey = Deno.env.get("DUFFEL_API_KEY")!;
    const duffelTestMode = Deno.env.get("DUFFEL_TEST_MODE") === "true";

    // Använd test-nyckel om testläge är aktivt
    const apiKey = duffelTestMode 
      ? Deno.env.get("DUFFEL_TEST_API_KEY") || duffelApiKey
      : duffelApiKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[cache-flight-prices] Starting... (test mode: ${duffelTestMode})`);

    // 1. Hämta alla aktiva trips med Duffel-flyg
    const { data: trips, error: tripsError } = await supabase
      .from("trips")
      .select("id, name, departure_date, return_date, departure_location")
      .eq("is_active", true)
      .eq("use_duffel_flights", true)
      .gte("departure_date", new Date().toISOString().split("T")[0]); // Bara framtida resor

    if (tripsError) {
      throw new Error(`Failed to fetch trips: ${tripsError.message}`);
    }

    if (!trips || trips.length === 0) {
      console.log("[cache-flight-prices] No active trips with Duffel flights found");
      return new Response(
        JSON.stringify({ success: true, message: "No trips to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[cache-flight-prices] Processing ${trips.length} trips`);

    const results = [];

    for (const trip of trips) {
      try {
        console.log(`[cache-flight-prices] Processing trip: ${trip.name} (${trip.id})`);

        // 2. Skapa offer request till Duffel
        const offerRequestBody = {
          data: {
            slices: [
              {
                origin: trip.departure_location, // t.ex. "CPH"
                destination: DESTINATION_IATA,    // "SPU"
                departure_date: trip.departure_date,
              },
              {
                origin: DESTINATION_IATA,
                destination: trip.departure_location,
                departure_date: trip.return_date,
              },
            ],
            passengers: [{ type: "adult" }],
            cabin_class: "economy",
          },
        };

        const offerResponse = await fetch(
          "https://api.duffel.com/air/offer_requests?return_offers=true&max_connections=1",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "Duffel-Version": "v2",
            },
            body: JSON.stringify(offerRequestBody),
          }
        );

        if (!offerResponse.ok) {
          const errorText = await offerResponse.text();
          console.error(`[cache-flight-prices] Duffel API error for ${trip.name}: ${errorText}`);
          results.push({ tripId: trip.id, tripName: trip.name, success: false, error: errorText });
          continue;
        }

        const offerData = await offerResponse.json();
        const offers: DuffelOffer[] = offerData.data?.offers || [];

        console.log(`[cache-flight-prices] Got ${offers.length} offers for ${trip.name}`);

        if (offers.length === 0) {
          results.push({ tripId: trip.id, tripName: trip.name, success: true, offersCount: 0 });
          continue;
        }

        // 3. Ta bort gamla cachade offers för denna trip
        const { error: deleteError } = await supabase
          .from("cached_flight_offers")
          .delete()
          .eq("trip_id", trip.id);

        if (deleteError) {
          console.error(`[cache-flight-prices] Failed to delete old offers: ${deleteError.message}`);
        }

        // 4. Förbered nya offers för insert
        const offersToInsert = offers.map((offer) => {
          const outboundSlice = offer.slices[0];
          const returnSlice = offer.slices[1];

          const outboundFirstSegment = outboundSlice?.segments[0];
          const outboundLastSegment = outboundSlice?.segments[outboundSlice.segments.length - 1];
          const returnFirstSegment = returnSlice?.segments[0];
          const returnLastSegment = returnSlice?.segments[returnSlice.segments.length - 1];

          // Bagage-info från första passagerare
          const baggages = offer.passengers[0]?.baggages || [];
          const hasCabinBaggage = baggages.some(b => b.type === "carry_on" && b.quantity > 0);
          const checkedBaggage = baggages.find(b => b.type === "checked" && b.quantity > 0);

          // Pris i SEK
          const priceOriginal = parseFloat(offer.total_amount);
          const priceSek = offer.total_currency === "SEK" 
            ? priceOriginal 
            : priceOriginal * EUR_TO_SEK;

          return {
            trip_id: trip.id,
            duffel_offer_id: offer.id,
            airline_name: offer.owner.name,
            airline_iata: offer.owner.iata_code || null,
            airline_logo_url: offer.owner.logo_symbol_url || null,
            outbound_departure_airport: outboundFirstSegment?.origin.iata_code || trip.departure_location,
            outbound_arrival_airport: outboundLastSegment?.destination.iata_code || DESTINATION_IATA,
            outbound_departure_time: outboundFirstSegment?.departing_at,
            outbound_arrival_time: outboundLastSegment?.arriving_at,
            outbound_duration_minutes: parseDuration(outboundSlice?.duration || "PT0M"),
            outbound_stops: Math.max(0, (outboundSlice?.segments.length || 1) - 1),
            return_departure_airport: returnFirstSegment?.origin.iata_code || DESTINATION_IATA,
            return_arrival_airport: returnLastSegment?.destination.iata_code || trip.departure_location,
            return_departure_time: returnFirstSegment?.departing_at,
            return_arrival_time: returnLastSegment?.arriving_at,
            return_duration_minutes: parseDuration(returnSlice?.duration || "PT0M"),
            return_stops: Math.max(0, (returnSlice?.segments.length || 1) - 1),
            price_sek: Math.round(priceSek * 100) / 100,
            price_original: priceOriginal,
            currency_original: offer.total_currency,
            cabin_baggage_included: hasCabinBaggage,
            checked_baggage_included: !!checkedBaggage,
            checked_baggage_weight_kg: checkedBaggage ? 23 : null, // Standard weight
            co2_emissions_kg: offer.total_emissions_kg ? parseFloat(offer.total_emissions_kg) : null,
            offer_expires_at: offer.expires_at,
            cached_at: new Date().toISOString(),
          };
        });

        // 5. Insert alla offers
        const { error: insertError } = await supabase
          .from("cached_flight_offers")
          .insert(offersToInsert);

        if (insertError) {
          console.error(`[cache-flight-prices] Failed to insert offers: ${insertError.message}`);
          results.push({ tripId: trip.id, tripName: trip.name, success: false, error: insertError.message });
          continue;
        }

        // 6. Hitta billigaste priset och uppdatera trips-tabellen
        const cheapestPrice = Math.min(...offersToInsert.map(o => o.price_sek));
        
        const { error: updateError } = await supabase
          .from("trips")
          .update({
            cached_flight_price: cheapestPrice,
            flight_price_cached_at: new Date().toISOString(),
          })
          .eq("id", trip.id);

        if (updateError) {
          console.error(`[cache-flight-prices] Failed to update trip: ${updateError.message}`);
        }

        console.log(`[cache-flight-prices] ✅ ${trip.name}: ${offers.length} offers cached, cheapest: ${cheapestPrice} SEK`);
        results.push({ 
          tripId: trip.id, 
          tripName: trip.name, 
          success: true, 
          offersCount: offers.length,
          cheapestPrice 
        });

      } catch (tripError) {
        console.error(`[cache-flight-prices] Error processing trip ${trip.name}:`, tripError);
        results.push({ 
          tripId: trip.id, 
          tripName: trip.name, 
          success: false, 
          error: tripError instanceof Error ? tripError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalOffers = results.reduce((sum, r) => sum + (r.offersCount || 0), 0);

    console.log(`[cache-flight-prices] Complete: ${successCount}/${trips.length} trips, ${totalOffers} total offers cached`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tripsProcessed: trips.length,
        successCount,
        totalOffersCached: totalOffers,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[cache-flight-prices] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
