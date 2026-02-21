import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripSearchResults } from "@/components/TripSearchResults";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/useSEO";
import { MonthPicker } from "@/components/MonthPicker";
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
  useSEO({
    title: "Sök resor till Kroatien | Studentresor",
    description: "Hitta och boka din studentresa till Kroatien. Filtrera på destination, avgångsort och datum.",
    canonical: "https://www.studentresor.com/search",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Resor", url: "https://www.studentresor.com/search" },
    ],
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [departure, setDeparture] = useState<string>(searchParams.get("departure") || "all");
  const [tripType, setTripType] = useState<string>(searchParams.get("tripType") || "all");
  const [guests, setGuests] = useState(parseInt(searchParams.get("guests") || "2", 10));
  const monthParam = searchParams.get("month");
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | undefined>(
    monthParam ? { year: parseInt(monthParam.split("-")[0]), month: parseInt(monthParam.split("-")[1]) - 1 } : undefined
  );
  const {
    data: trips,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["trips", departure, tripType, selectedMonth?.year, selectedMonth?.month, guests],
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
      if (selectedMonth) {
        const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`;
        const endYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year;
        const endMonth = selectedMonth.month === 11 ? 1 : selectedMonth.month + 2;
        const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
        query = query.gte("departure_date", startDate).lt("departure_date", endDate);
      }
      query = query.gte("max_persons", guests);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: availableMonths } = useQuery({
    queryKey: ["available-months"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("departure_date")
        .eq("is_active", true);
      if (error) throw error;
      const months = new Set<string>();
      data?.forEach((t) => {
        const d = new Date(t.departure_date);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      });
      return Array.from(months).map((m) => {
        const [year, month] = m.split("-").map(Number);
        return { year, month };
      });
    },
  });

  const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  const handleSearch = () => {
    const params: Record<string, string> = {
      departure,
      tripType,
      guests: guests.toString(),
    };
    if (selectedMonth) {
      params.month = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}`;
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
            {selectedMonth ? `${MONTH_NAMES_SHORT[selectedMonth.month]} ${selectedMonth.year}` : "Alla månader"}
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

          {/* Månad */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Avresemånad
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-background",
                    !selectedMonth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedMonth
                    ? `${MONTH_NAMES_SHORT[selectedMonth.month]} ${selectedMonth.year}`
                    : "Välj månad"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <MonthPicker
                  selected={selectedMonth}
                  onSelect={setSelectedMonth}
                  availableMonths={availableMonths}
                />
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