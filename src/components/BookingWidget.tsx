import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MonthPicker } from "@/components/MonthPicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const BookingWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [departure, setDeparture] = useState<string>("all");
  const [tripType, setTripType] = useState<string>("all");
  const [guests, setGuests] = useState(2);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | undefined>();

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = (window as any).requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(id);
    }
  }, []);

  const { data: availableMonths } = useQuery({
    queryKey: ["available-months"],
    enabled: ready,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("departure_date").eq("is_active", true);
      if (error) throw error;
      const months = new Set<string>();
      data?.forEach((trip) => {
        const d = new Date(trip.departure_date);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      });
      return Array.from(months).map((m) => {
        const [year, month] = m.split("-").map(Number);
        return { year, month };
      });
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams({
      departure,
      tripType,
      guests: guests.toString(),
      ...(selectedMonth && { month: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}` }),
    });
    navigate(`/search?${params.toString()}`);
  };

  const departures = [
    { value: "all", label: t("booking.allDepartures") },
    { value: "kastrup", label: "Kastrup (CPH)" },
    { value: "landvetter", label: "Landvetter (GOT)" },
    { value: "arlanda", label: "Arlanda (ARN)" },
  ];

  const tripTypes = [
    { value: "all", label: t("booking.allTrips") },
    { value: "seglingsvecka", label: t("booking.sailingWeek") },
    { value: "splitveckan", label: t("trips.splitveckan") },
    { value: "studentveckan", label: t("trips.studentveckan") },
  ];

  return (
    <div className="bg-background/10 backdrop-blur-sm rounded-2xl shadow-elegant border border-white/20 p-6 grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
      <div className="space-y-2">
        <label htmlFor="departure-select" className="text-sm font-medium text-foreground/80">{t("booking.departure")}</label>
        <Select value={departure} onValueChange={setDeparture}>
          <SelectTrigger id="departure-select" className="w-full h-12 bg-background" aria-label={t("booking.selectAirport")}>
            <SelectValue placeholder={t("booking.selectAirport")} />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {departures.map((dep) => (<SelectItem key={dep.value} value={dep.value}>{dep.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="trip-type-select" className="text-sm font-medium text-foreground/80">{t("booking.ourTrips")}</label>
        <Select value={tripType} onValueChange={setTripType}>
          <SelectTrigger id="trip-type-select" className="w-full h-12 bg-background" aria-label={t("booking.ourTrips")}>
            <SelectValue placeholder={t("booking.allTrips")} />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {tripTypes.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">{t("booking.departureMonth")}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal bg-background", !selectedMonth && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedMonth
                ? `${["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"][selectedMonth.month]} ${selectedMonth.year}`
                : t("booking.selectMonth")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
            <MonthPicker selected={selectedMonth} onSelect={setSelectedMonth} availableMonths={availableMonths} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">{t("booking.travelers")}</label>
        <div className="flex items-center h-12 border rounded-md bg-background">
          <Button type="button" variant="ghost" size="icon" className="h-full rounded-r-none" onClick={() => setGuests((p) => Math.max(p - 1, 1))} disabled={guests <= 1} aria-label={t("booking.decreaseTravelers")}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center font-medium" aria-live="polite">{guests}</span>
          <Button type="button" variant="ghost" size="icon" className="h-full rounded-l-none" onClick={() => setGuests((p) => Math.min(p + 1, 10))} disabled={guests >= 10} aria-label={t("booking.increaseTravelers")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button onClick={handleSearch} className="h-12 bg-ocean hover:bg-ocean/90 text-white font-semibold col-span-2 md:col-span-1">
        <Search className="mr-2 h-4 w-4" />
        {t("booking.searchTrips")}
      </Button>
    </div>
  );
};
