import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TravelerInfo } from "@/pages/BookTrip";

interface BookingStep2Props {
  travelerInfo: TravelerInfo;
  setTravelerInfo: (info: TravelerInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const BookingStep2 = ({
  travelerInfo,
  setTravelerInfo,
  onNext,
  onPrev,
}: BookingStep2Props) => {
  const updateField = (field: keyof TravelerInfo, value: string | Date | undefined) => {
    setTravelerInfo({ ...travelerInfo, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Steg 2: Resenärinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Förnamn <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Förnamn"
                value={travelerInfo.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Efternamn <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Efternamn"
                value={travelerInfo.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              E-post <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="din@email.se"
              value={travelerInfo.email}
              onChange={(e) => updateField("email", e.target.value)}
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
                      !travelerInfo.birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {travelerInfo.birthDate
                      ? format(travelerInfo.birthDate, "PPP", { locale: sv })
                      : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={travelerInfo.birthDate}
                    onSelect={(date) => updateField("birthDate", date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className="pointer-events-auto"
                    captionLayout="dropdown-buttons"
                    fromYear={1940}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefonnummer <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="070-123 45 67"
                value={travelerInfo.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Departure Location */}
          <div className="space-y-2">
            <Label htmlFor="departureLocation">
              Avgångsort <span className="text-destructive">*</span>
            </Label>
            <Input
              id="departureLocation"
              placeholder="T.ex. Stockholm, Göteborg, Malmö"
              value={travelerInfo.departureLocation}
              onChange={(e) => updateField("departureLocation", e.target.value)}
            />
          </div>

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
        </CardContent>
      </Card>
    </motion.div>
  );
};
