import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, ChevronDown, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const departures = [
  { value: "kastrup", label: "Kastrup (CPH)" },
  { value: "landvetter", label: "Landvetter (GOT)" },
  { value: "arlanda", label: "Arlanda (ARN)" },
];

export const BookingWidget = () => {
  const [departure, setDeparture] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [destination, setDestination] = useState<string>("");
  const [guests, setGuests] = useState(2);
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (departure) params.set("departure", departure);
    if (date) params.set("date", format(date, "yyyy-MM-dd"));
    if (destination) params.set("destination", destination);
    params.set("guests", guests.toString());
    navigate(`/destinations?${params.toString()}`);
  };

  const incrementGuests = () => setGuests((prev) => Math.min(prev + 1, 10));
  const decrementGuests = () => setGuests((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-elegant border border-border p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
            {departures.map((dep) => (
              <SelectItem key={dep.value} value={dep.value}>
                {dep.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Datum */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Datum
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
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Våra resor */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Våra resor
        </label>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger className="w-full h-12 bg-background">
            <SelectValue placeholder="Alla destinationer" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Alla destinationer</SelectItem>
            <SelectItem value="beach">Strandresor</SelectItem>
            <SelectItem value="city">Storstadsresor</SelectItem>
            <SelectItem value="adventure">Äventyrsresor</SelectItem>
            <SelectItem value="ski">Skidresor</SelectItem>
          </SelectContent>
        </Select>
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
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center font-medium">{guests}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-full rounded-l-none"
            onClick={incrementGuests}
            disabled={guests >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sök-knapp */}
      <Button
        onClick={handleSearch}
        className="h-12 bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold"
      >
        <Search className="mr-2 h-4 w-4" />
        Sök
      </Button>
    </div>
  );
};
