import { useState, useMemo, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { departureToIATA, useFlightSearch } from "@/hooks/useFlightSearch";
import { useSearchParams } from "react-router-dom";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useSEO } from "@/hooks/useSEO";
import { MonthPicker } from "@/components/MonthPicker";
import { SearchFilterBar } from "@/components/search/SearchFilterBar";
import { SearchBreadcrumb } from "@/components/search/SearchBreadcrumb";
import { AccommodationCard } from "@/components/search/AccommodationCard";

const SearchMap = lazy(() => import("@/components/search/SearchMap").then(m => ({ default: m.SearchMap })));

const departures = [
  { value: "all", labelKey: "search.allDepartures" },
  { value: "kastrup", label: "Kastrup (CPH)" },
  { value: "landvetter", label: "Landvetter (GOT)" },
  { value: "arlanda", label: "Arlanda (ARN)" },
];

const tripTypes = [
  { value: "all", labelKey: "search.allTrips" },
  { value: "seglingsvecka", labelKey: "trips.segelveckan" },
  { value: "splitveckan", labelKey: "trips.splitveckan" },
  { value: "studentveckan", labelKey: "trips.studentveckan" },
];

const SearchTrips = () => {
  const { t } = useTranslation();

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

  // New filter state
  const [showMap, setShowMap] = useState(true);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 50000]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("price_asc");
  const [hoveredTripId, setHoveredTripId] = useState<string | null>(null);

  const { data: trips, isLoading, refetch } = useQuery({
    queryKey: ["trips", departure, tripType, selectedMonth?.year, selectedMonth?.month, guests],
    queryFn: async () => {
      let query = supabase.from("trips").select("*").eq("is_active", true).order("departure_date", { ascending: true });
      if (tripType !== "all") query = query.eq("trip_type", tripType as "seglingsvecka" | "splitveckan" | "studentveckan");
      if (departure !== "all") query = query.ilike("departure_location", `%${departure}%`);
      if (selectedMonth) {
        const startDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}-01`;
        const endYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year;
        const endMonth = selectedMonth.month === 11 ? 1 : selectedMonth.month + 2;
        const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
        query = query.gte("departure_date", startDate).lt("departure_date", endDate);
      }
      query = query.gte("max_persons", guests).lte("min_persons", guests);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: availableMonths } = useQuery({
    queryKey: ["available-months"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("departure_date").eq("is_active", true);
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

  // Fetch trip images
  const tripIds = trips?.map(t => t.id) || [];
  const { data: allTripImages } = useQuery({
    queryKey: ["trip-images-search", tripIds],
    queryFn: async () => {
      if (tripIds.length === 0) return [];
      const { data, error } = await supabase
        .from("trip_images")
        .select("*")
        .in("trip_id", tripIds)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: tripIds.length > 0,
  });

  const imagesByTrip = useMemo(() => {
    return (allTripImages || []).reduce((acc, img) => {
      acc[img.trip_id] = acc[img.trip_id] || [];
      acc[img.trip_id]!.push(img);
      return acc;
    }, {} as Record<string, typeof allTripImages>);
  }, [allTripImages]);

  // Flight search
  const anyTripUsesDuffel = trips?.some(t => t.use_duffel_flights !== false);
  const firstTrip = trips?.[0];
  const departureIATA = departure !== "all" ? departureToIATA[departure] : undefined;
  const flightSearchParams = anyTripUsesDuffel && departureIATA && firstTrip ? {
    origin: departureIATA,
    destination: "SPU",
    departure_date: firstTrip.departure_date,
    return_date: firstTrip.return_date,
    passengers: guests,
  } : null;
  const { data: flightData, isLoading: flightLoading } = useFlightSearch(flightSearchParams);
  const cheapestFlightPrice = flightData?.offers?.[0]
    ? parseFloat(flightData.offers[0].price_per_passenger_sek)
    : null;

  // Sort & filter trips
  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    let filtered = [...trips];

    // Budget filter (approximate, using trip.price as fallback)
    filtered = filtered.filter(t => t.price >= budgetRange[0] && t.price <= budgetRange[1]);

    // Facility filter
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter(t =>
        selectedFacilities.every(f => t.accommodation_facilities?.includes(f))
      );
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "date_asc":
        filtered.sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());
        break;
      case "capacity_desc":
        filtered.sort((a, b) => b.capacity - a.capacity);
        break;
    }

    return filtered;
  }, [trips, budgetRange, selectedFacilities, sortBy]);

  const maxBudget = useMemo(() => {
    if (!trips || trips.length === 0) return 50000;
    return Math.max(...trips.map(t => t.price)) + 5000;
  }, [trips]);

  const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  const handleSearch = () => {
    const params: Record<string, string> = { departure, tripType, guests: guests.toString() };
    if (selectedMonth) params.month = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}`;
    setSearchParams(params);
    refetch();
  };

  const mapTrips = useMemo(() =>
    filteredTrips.map(t => ({
      id: t.id,
      name: t.name,
      price: t.price,
      latitude: (t as any).latitude ?? null,
      longitude: (t as any).longitude ?? null,
    })),
    [filteredTrips]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mt-20">
        {/* Search Widget */}
        <div className="container mx-auto px-4 py-4">
          <div className="bg-card rounded-2xl shadow-elegant border border-border p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("search.departure")}</label>
              <Select value={departure} onValueChange={setDeparture}>
                <SelectTrigger className="w-full h-10 bg-background text-sm">
                  <SelectValue placeholder={t("search.selectAirport")} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {departures.map((dep) => (
                    <SelectItem key={dep.value} value={dep.value}>
                      {dep.label || t(dep.labelKey!)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("search.ourTrips")}</label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger className="w-full h-10 bg-background text-sm">
                  <SelectValue placeholder={t("search.allTrips")} />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {tripTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(type.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("search.departureMonth")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-10 justify-start text-left font-normal bg-background text-sm", !selectedMonth && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? `${MONTH_NAMES_SHORT[selectedMonth.month]} ${selectedMonth.year}` : t("search.selectMonth")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <MonthPicker selected={selectedMonth} onSelect={setSelectedMonth} availableMonths={availableMonths} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("search.numTravelers")}</label>
              <div className="flex items-center h-10 border rounded-md bg-background">
                <Button type="button" variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => setGuests(p => Math.max(p - 1, 1))} disabled={guests <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center font-medium text-sm">{guests}</span>
                <Button type="button" variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => setGuests(p => Math.min(p + 1, 10))} disabled={guests >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleSearch} className="h-10 bg-ocean hover:bg-ocean/90 text-white font-semibold text-sm">
              <Search className="mr-2 h-4 w-4" />
              {t("search.searchTrips")}
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="container mx-auto px-4 pb-2">
          <SearchFilterBar
            showMap={showMap}
            onToggleMap={() => setShowMap(!showMap)}
            budgetRange={budgetRange}
            onBudgetChange={setBudgetRange}
            maxBudget={maxBudget}
            selectedPropertyTypes={selectedPropertyTypes}
            onPropertyTypesChange={setSelectedPropertyTypes}
            selectedFacilities={selectedFacilities}
            onFacilitiesChange={setSelectedFacilities}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Breadcrumb + Content */}
        <div className="container mx-auto px-4">
          <SearchBreadcrumb currentStep={1} />

          <div className={cn("flex gap-4 items-start relative", showMap ? "" : "")}>
            {/* Results list */}
            <div className={cn("flex-1 min-w-0 space-y-3 pb-8", showMap ? "max-w-[60%]" : "")}>
              <p className="text-sm text-muted-foreground">
                {filteredTrips.length} resultat hittades
              </p>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card rounded-xl p-6 animate-pulse flex gap-4">
                      <div className="w-56 h-48 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-2/3" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <p className="text-lg text-muted-foreground">{t("search.noResults")}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t("search.tryOther")}</p>
                </div>
              ) : (
                filteredTrips.map((trip) => (
                  <AccommodationCard
                    key={trip.id}
                    trip={trip}
                    images={imagesByTrip[trip.id] || []}
                    cheapestFlightPrice={cheapestFlightPrice}
                    flightLoading={flightLoading}
                    guests={guests}
                    isSelected={hoveredTripId === trip.id}
                    onHover={setHoveredTripId}
                    departureIATA={departureIATA}
                    flightOffer={flightData?.offers?.[0] || null}
                  />
                ))
              )}
            </div>

            {/* Map */}
            {showMap && (
              <div className="w-[40%] hidden lg:block sticky top-24 self-start h-[calc(100vh-8rem)] rounded-lg overflow-hidden">
                <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse rounded-lg" />}>
                  <SearchMap
                    trips={mapTrips}
                    selectedTripId={hoveredTripId}
                    onTripSelect={(id) => {
                      const el = document.getElementById(`trip-${id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      setHoveredTripId(id);
                    }}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchTrips;
