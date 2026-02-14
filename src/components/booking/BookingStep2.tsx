import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TravelerInfo } from "@/pages/BookTrip";

const DEPARTURE_LOCATIONS = [
  "Arlanda (ARN)",
  "Landvetter (GOT)",
  "Kastrup (CPH)",
];

interface BookingStep2Props {
  travelersInfo: TravelerInfo[];
  setTravelersInfo: (info: TravelerInfo[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const BookingStep2 = ({
  travelersInfo,
  setTravelersInfo,
  onNext,
  onPrev,
}: BookingStep2Props) => {
  const updateField = (index: number, field: keyof TravelerInfo, value: string | Date | undefined) => {
    const updated = [...travelersInfo];
    updated[index] = { ...updated[index], [field]: value };
    setTravelersInfo(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {travelersInfo.map((traveler, index) => (
        <Card key={index} className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <UserRound className="w-6 h-6 text-primary" />
              {travelersInfo.length > 1
                ? `Resenär ${index + 1} av ${travelersInfo.length}`
                : "Resenärinformation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor={`firstName-${index}`}>
                  Förnamn <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
                </Label>
                <Input
                  id={`firstName-${index}`}
                  placeholder="Förnamn"
                  value={traveler.firstName}
                  onChange={(e) => updateField(index, "firstName", e.target.value)}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor={`lastName-${index}`}>
                  Efternamn <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
                </Label>
                <Input
                  id={`lastName-${index}`}
                  placeholder="Efternamn"
                  value={traveler.lastName}
                  onChange={(e) => updateField(index, "lastName", e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor={`email-${index}`}>
                E-post <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`email-${index}`}
                type="email"
                placeholder="din@email.se"
                value={traveler.email}
                onChange={(e) => updateField(index, "email", e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Birth Date */}
              <div className="space-y-2">
                <Label>
                  Födelsedatum <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !traveler.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {traveler.birthDate
                        ? format(traveler.birthDate, "PPP", { locale: sv })
                        : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={traveler.birthDate}
                      onSelect={(date) => updateField(index, "birthDate", date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor={`phone-${index}`}>
                  Telefonnummer <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`phone-${index}`}
                  type="tel"
                  placeholder="070-123 45 67"
                  value={traveler.phone}
                  onChange={(e) => updateField(index, "phone", e.target.value)}
                />
              </div>
            </div>

            {/* Departure Location */}
            <div className="space-y-2">
              <Label>
                Avgångsort <span className="text-destructive">*</span>
              </Label>
              <Select
                value={traveler.departureLocation}
                onValueChange={(value) => updateField(index, "departureLocation", value)}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Välj avgångsort" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {DEPARTURE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="flex-1 h-14"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="flex-1 bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
        >
          Fortsätt
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
