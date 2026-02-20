import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MonthPicker } from "@/components/MonthPicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const departures = [
  { value: "all", label: "Alla avgångsorter" },
  { value: "kastrup", label: "Kastrup (CPH)" },
  { value: "landvetter", label: "Landvetter (GOT)" },
  { value: "arlanda", label: "Arlanda (ARN)" },
];

const tripTypes = [
  { value: "all", label: "Alla resor" },
  { value: "seglingsvecka", label: "Seglingsvecka" },
  { value: "splitveckan", label: "Splitveckan" },
  { value: "studentveckan", label: "Studentveckan" },
];

export const BookingWidget = () => {
  const navigate = useNavigate();
  const [departure, setDeparture] = useState<string>("all");
  const [tripType, setTripType] = useState<string>("all");
  const [guests, setGuests] = useState(2);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | undefined>();

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

  const handleSearch = () => {
    const params = new URLSearchParams({
      departure,
      tripType,
      guests: guests.toString(),
      ...(selectedMonth && { month: `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, "0")}` }),
    });
    navigate(`/search?${params.toString()}`);
  };

  const incrementGuests = () => setGuests((prev) => Math.min(prev + 1, 10));
  const decrementGuests = () => setGuests((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-background/10 backdrop-blur-sm rounded-2xl shadow-elegant border border-white/20 p-6 grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
      {/* Avreseort */}
      <div className="space-y-2">
        <label htmlFor="departure-select" className="text-sm font-medium text-muted-foreground">
          Avreseort
        </label>
        <Select value={departure} onValueChange={setDeparture}>
          <SelectTrigger id="departure-select" className="w-full h-12 bg-background" aria-label="Välj avreseort">
            <SelectValue placeholder="Välj flygplats" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {departures.map((dep) => (
              <SelectItem key={dep.value} value={dep.value}>
                {dep.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Våra resor */}
      <div className="space-y-2">
        <label htmlFor="trip-type-select" className="text-sm font-medium text-muted-foreground">
          Våra resor
        </label>
        <Select value={tripType} onValueChange={setTripType}>
          <SelectTrigger id="trip-type-select" className="w-full h-12 bg-background" aria-label="Välj resa">
            <SelectValue placeholder="Alla resor" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {tripTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
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
                ? `${["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"][selectedMonth.month]} ${selectedMonth.year}`
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full rounded-r-none"
            onClick={decrementGuests}
            disabled={guests <= 1}
            aria-label="Minska antal resenärer"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center font-medium" aria-live="polite" aria-label={`${guests} resenärer`}>{guests}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full rounded-l-none"
            onClick={incrementGuests}
            disabled={guests >= 10}
            aria-label="Öka antal resenärer"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sök-knapp */}
      <Button
        onClick={handleSearch}
        className="h-12 bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold col-span-2 md:col-span-1"
      >
        <Search className="mr-2 h-4 w-4" />
        Sök resor
      </Button>
    </div>
  );
};
