import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripSearchResults } from "@/components/TripSearchResults";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
const departures = [{
  value: "all",
  label: "Alla avgångsorter"
}, {
  value: "kastrup",
  label: "Kastrup (CPH)"
}, {
  value: "landvetter",
  label: "Landvetter (GOT)"
}, {
  value: "arlanda",
  label: "Arlanda (ARN)"
}];
const tripTypes = [{
  value: "all",
  label: "Alla resor"
}, {
  value: "seglingsvecka",
  label: "Seglingsvecka"
}, {
  value: "splitveckan",
  label: "Splitveckan"
}, {
  value: "studentveckan",
  label: "Studentveckan"
}];
const SearchTrips = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [departure, setDeparture] = useState<string>(searchParams.get("departure") || "all");
  const [tripType, setTripType] = useState<string>(searchParams.get("tripType") || "all");
  const [guests, setGuests] = useState(parseInt(searchParams.get("guests") || "2", 10));
  const {
    data: trips,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["trips", departure, tripType],
    queryFn: async () => {
      let query = supabase.from("trips").select("*").eq("is_active", true).order("departure_date", {
        ascending: true
      });
      if (tripType !== "all") {
        query = query.eq("trip_type", tripType as "seglingsvecka" | "splitveckan" | "studentveckan");
      }
      if (departure !== "all") {
        query = query.ilike("departure_location", `%${departure}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data;
    }
  });
  const handleSearch = () => {
    setSearchParams({
      departure,
      tripType,
      guests: guests.toString()
    });
    refetch();
  };
  const incrementGuests = () => setGuests(prev => Math.min(prev + 1, 10));
  const decrementGuests = () => setGuests(prev => Math.max(prev - 1, 1));
  return <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8">
          ​Din sökning     
        </h1>

        {/* Search Widget */}
        <div className="bg-card rounded-2xl shadow-elegant border border-border p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Avreseort */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Avreseort
            </label>
            <Select value={departure} onValueChange={setDeparture}>
              <SelectTrigger className="w-full h-12 bg-background">
                <SelectValue placeholder="Välj flygplats" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {departures.map(dep => <SelectItem key={dep.value} value={dep.value}>
                    {dep.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Våra resor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Våra resor
            </label>
            <Select value={tripType} onValueChange={setTripType}>
              <SelectTrigger className="w-full h-12 bg-background">
                <SelectValue placeholder="Alla resor" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {tripTypes.map(type => <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Antal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Antal resenärer
            </label>
            <div className="flex items-center h-12 border rounded-md bg-background">
              <Button type="button" variant="ghost" size="icon" className="h-full rounded-r-none" onClick={decrementGuests} disabled={guests <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center font-medium">{guests}</span>
              <Button type="button" variant="ghost" size="icon" className="h-full rounded-l-none" onClick={incrementGuests} disabled={guests >= 10}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sök-knapp */}
          <Button onClick={handleSearch} className="h-12 bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold">
            <Search className="mr-2 h-4 w-4" />
            Sök resor
          </Button>
        </div>

        {/* Search Results */}
        <TripSearchResults trips={trips || []} isLoading={isLoading} />

        {/* No results message */}
        {!isLoading && trips?.length === 0 && <div className="mt-8 text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-lg text-muted-foreground">
              Inga resor hittades med dina sökkriterier.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Prova att ändra dina filter eller sök efter alla resor.
            </p>
          </div>}
      </main>

      <Footer />
    </div>;
};
export default SearchTrips;