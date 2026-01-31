import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleSearch = () => {
    const params = new URLSearchParams({
      departure,
      tripType,
      guests: guests.toString(),
    });
    navigate(`/search?${params.toString()}`);
  };

  const incrementGuests = () => setGuests((prev) => Math.min(prev + 1, 10));
  const decrementGuests = () => setGuests((prev) => Math.max(prev - 1, 1));

  return (
    <div className="bg-background/10 backdrop-blur-sm rounded-2xl shadow-elegant border border-white/20 p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            {tripTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
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
        Sök resor
      </Button>
    </div>
  );
};
