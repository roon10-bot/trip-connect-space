import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, MapPin, Users, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Trip {
  id: string;
  name: string;
  trip_type: string;
  departure_date: string;
  return_date: string;
  departure_location: string;
  price: number;
  base_price?: number | null;
  min_persons?: number | null;
  max_persons?: number | null;
}

interface BookingTripSummaryProps {
  trip: Trip;
  travelers: number;
  appliedDiscount: {
    code: string;
    percent: number | null;
    amount: number | null;
  } | null;
  totalPrice: number;
  formatTripType: (type: string) => string;
}

export const BookingTripSummary = ({
  trip,
  travelers,
  appliedDiscount,
  totalPrice,
  formatTripType,
}: BookingTripSummaryProps) => {
  // For Splitveckan, calculate price per person based on group size
  const isSplitVeckan = trip.trip_type === "splitveckan";
  const pricePerPerson = isSplitVeckan && trip.base_price && travelers > 0
    ? Math.ceil((Number(trip.base_price) * 1.20) / travelers)
    : trip.price;
  
  const baseTotal = pricePerPerson * travelers;
  const discountAmount = baseTotal - totalPrice;

  return (
    <Card className="shadow-elegant sticky top-28">
      <CardHeader className="pb-4">
        <CardTitle className="font-serif text-xl">Din resa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Info */}
        <div>
          <span className="px-2 py-1 rounded-full bg-ocean-light text-primary text-xs font-medium">
            {formatTripType(trip.trip_type)}
          </span>
          <h3 className="text-lg font-semibold mt-2">{trip.name}</h3>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm">
            {format(new Date(trip.departure_date), "d MMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMM yyyy", { locale: sv })}
          </span>
        </div>

        {/* Departure Location */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm">Avgång från {trip.departure_location}</span>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          {/* Price per person */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pris per person</span>
            <span className="font-medium">{pricePerPerson.toLocaleString("sv-SE")} kr</span>
          </div>

          {/* Travelers */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" />
              Antal resenärer
            </span>
            <span className="font-medium">{travelers}</span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delsumma</span>
            <span className="font-medium">{baseTotal.toLocaleString("sv-SE")} kr</span>
          </div>

          {/* Discount */}
          {appliedDiscount && discountAmount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Rabatt ({appliedDiscount.code})
              </span>
              <span>-{discountAmount.toLocaleString("sv-SE")} kr</span>
            </div>
          )}

          {/* Total */}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Totalpris</span>
              <span className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString("sv-SE")} kr
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
