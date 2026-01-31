import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripSearchResults } from "@/components/TripSearchResults";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
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
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined
  );

  // Fetch available dates based on current filters
  const { data: availableDatesData } = useQuery({
    queryKey: ["available-dates", departure, tripType],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select("departure_date, departure_location, trip_type")
        .eq("is_active", true)
        .gte("departure_date", new Date().toISOString().split("T")[0]);

      if (tripType !== "all") {
        query = query.eq("trip_type", tripType as "seglingsvecka" | "splitveckan" | "studentveckan");
      }
      if (departure !== "all") {
        query = query.ilike("departure_location", `%${departure}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Extract available dates
  const availableDates = useMemo(() => {
    if (!availableDatesData) return [];
    return availableDatesData.map((trip) => parseISO(trip.departure_date));
  }, [availableDatesData]);

  // Check if a date is available
  const isDateAvailable = (checkDate: Date) => {
    return availableDates.some((availableDate) => isSameDay(availableDate, checkDate));
  };

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
    const params: Record<string, string> = {
      departure,
      tripType,
      guests: guests.toString(),
    };
    if (date) {
      params.date = format(date, "yyyy-MM-dd");
    }
    setSearchParams(params);
    refetch();
  };
  const incrementGuests = () => setGuests(prev => Math.min(prev + 1, 10));
  const decrementGuests = () => setGuests(prev => Math.max(prev - 1, 1));
  return <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="bg-card rounded-2xl shadow-elegant border border-border p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Din sökning
          </h1>
          <p className="text-muted-foreground">
            {departures.find(d => d.value === departure)?.label || "Alla avgångsorter"}
            {" · "}
            {tripTypes.find(t => t.value === tripType)?.label || "Alla resor"}
            {" · "}
            {date ? format(date, "d MMM yyyy", { locale: sv }) : "Alla datum"}
            {" · "}
            {guests} {guests === 1 ? "resenär" : "resenärer"}
          </p>
        </div>
        {/* Search Widget */}
        <div className="bg-card rounded-2xl shadow-elegant border border-border p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

          {/* Datum */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Avresedatum
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-background",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={sv}
                  disabled={(checkDate) => !isDateAvailable(checkDate)}
                  modifiers={{
                    available: availableDates,
                  }}
                  modifiersClassNames={{
                    available: "bg-primary/20 text-primary font-semibold hover:bg-primary hover:text-primary-foreground",
                  }}
                  className="pointer-events-auto"
                />
                {availableDates.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground text-center border-t">
                    Inga tillgängliga datum för valda filter
                  </p>
                )}
              </PopoverContent>
            </Popover>
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