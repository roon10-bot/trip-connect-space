import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FlightOffer {
  id: string;
  total_amount_original: string;
  total_currency_original: string;
  total_amount_sek: string;
  price_per_passenger_sek: string;
  airline: string;
  airline_logo: string | null;
  slices: {
    origin: string;
    origin_name: string;
    destination: string;
    destination_name: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    stops: number;
  }[];
}

interface SearchFlightsParams {
  origin: string; // IATA code e.g. "CPH"
  destination: string; // IATA code e.g. "SPU"
  departure_date: string; // YYYY-MM-DD
  return_date?: string; // YYYY-MM-DD for round-trip
  passengers: number;
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  total_offers: number;
  exchange_rate: number;
  is_test: boolean;
}

// Map widget departure values to IATA codes
export const departureToIATA: Record<string, string> = {
  kastrup: "CPH",
  landvetter: "GOT",
  arlanda: "ARN",
};

export function useFlightSearch(params: SearchFlightsParams | null) {
  return useQuery<FlightSearchResult>({
    queryKey: ["flight-search", params?.origin, params?.destination, params?.departure_date, params?.passengers],
    enabled: !!params && !!params.origin && !!params.destination && !!params.departure_date,
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 1,
    queryFn: async () => {
      if (!params) throw new Error("No params");

      const { data, error } = await supabase.functions.invoke("search-flights", {
        body: params,
      });

      if (error) throw error;
      return data as FlightSearchResult;
    },
  });
}
