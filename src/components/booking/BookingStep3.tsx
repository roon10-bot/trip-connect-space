import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowLeft, ArrowRight, User, Mail, Phone, MapPin, Calendar, Plane, Tag } from "lucide-react";
import { getSplitPricePerPerson } from "@/lib/paymentCalculations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelerInfo } from "@/pages/BookTrip";

interface Trip {
  id: string;
  name: string;
  trip_type: string;
  departure_date: string;
  return_date: string;
  departure_location: string;
  price: number;
  base_price?: number | null;
  description: string | null;
}

interface BookingStep3Props {
  trip: Trip;
  travelers: number;
  travelersInfo: TravelerInfo[];
  totalPrice: number;
  formatTripType: (type: string) => string;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const BookingStep3 = ({
  trip,
  travelers,
  travelersInfo,
  totalPrice,
  formatTripType,
  onPrev,
  onSubmit,
  isSubmitting,
}: BookingStep3Props) => {
  const isSplitVeckan = trip.trip_type === "splitveckan";
  const pricePerPerson = isSplitVeckan && travelers > 0
    ? (getSplitPricePerPerson(trip, travelers) || trip.price)
    : trip.price;
  const baseTotal = pricePerPerson * travelers;
  const totalDiscount = travelersInfo.reduce((sum, t) => sum + (t.discount?.calculatedAmount || 0), 0);
  const travelersWithDiscount = travelersInfo.filter((t) => t.discount);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Traveler Information Summary */}
      {travelersInfo.map((traveler, index) => (
        <Card key={index} className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-xl">
              {travelersInfo.length > 1 ? `Resenär ${index + 1}` : "Resenärinformation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Namn</p>
                  <p className="font-medium">{traveler.firstName} {traveler.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">E-post</p>
                  <p className="font-medium">{traveler.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Födelsedatum</p>
                  <p className="font-medium">
                    {traveler.birthDate
                      ? format(traveler.birthDate, "d MMMM yyyy", { locale: sv })
                      : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{traveler.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avgångsort</p>
                  <p className="font-medium">{traveler.departureLocation}</p>
                </div>
              </div>
            </div>
            {traveler.discount && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md mt-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {traveler.discount.code} (-{traveler.discount.calculatedAmount.toLocaleString("sv-SE")} kr)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Trip Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Reseöversikt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Plane className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="font-semibold text-lg">{trip.name}</p>
              <p className="text-muted-foreground">{formatTripType(trip.trip_type)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <p>
              {format(new Date(trip.departure_date), "d MMMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMMM yyyy", { locale: sv })}
            </p>
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>{pricePerPerson.toLocaleString("sv-SE")} kr x {travelers} resenärer</span>
              <span>{baseTotal.toLocaleString("sv-SE")} kr</span>
            </div>
            
            {travelersWithDiscount.length > 0 && (
              <div className="space-y-1">
                {travelersWithDiscount.length <= 3 ? (
                  travelersWithDiscount.map((t, i) => {
                    const travelerIndex = travelersInfo.indexOf(t);
                    return (
                      <div key={i} className="flex justify-between text-sm text-primary">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Resenär {travelerIndex + 1} ({t.discount!.code})
                        </span>
                        <span>-{t.discount!.calculatedAmount.toLocaleString("sv-SE")} kr</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex justify-between text-sm text-primary">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Rabatter ({travelersWithDiscount.length} st)
                    </span>
                    <span>-{totalDiscount.toLocaleString("sv-SE")} kr</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-lg font-semibold">Totalt att betala</span>
              <span className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString("sv-SE")} kr
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="flex-1 h-14"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Button
          onClick={onSubmit}
          size="lg"
          className="flex-1 bg-sunset hover:bg-sunset/90 text-accent-foreground text-lg font-semibold h-14"
          disabled={isSubmitting}
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Gå till betalning
        </Button>
      </div>
    </motion.div>
  );
};
