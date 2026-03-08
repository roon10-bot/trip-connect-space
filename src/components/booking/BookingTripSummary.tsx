import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, MapPin, Users, Tag, Plane, Loader2, ChevronDown } from "lucide-react";
import { getSplitPricePerPerson, calculateSplitPricePerPerson } from "@/lib/paymentCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AccommodationInfoDialog } from "@/components/AccommodationInfoDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FlightOffer } from "@/hooks/useFlightSearch";

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
  accommodation_rooms?: number | null;
  accommodation_size_sqm?: number | null;
  accommodation_facilities?: string[] | null;
  accommodation_address?: string | null;
  accommodation_description?: string | null;
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
  flightOffer?: FlightOffer | null;
  flightLoading?: boolean;
}

export const BookingTripSummary = ({
  trip,
  travelers,
  appliedDiscount,
  totalPrice,
  formatTripType,
  flightOffer,
  flightLoading,
}: BookingTripSummaryProps) => {
  // For Splitveckan, calculate price per person based on group size
  const isSplitVeckan = trip.trip_type === "splitveckan";
  const pricePerPerson = isSplitVeckan && travelers > 0
    ? (getSplitPricePerPerson(trip, travelers) || trip.price)
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

        {/* Max persons */}
        {trip.max_persons && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm">Max {trip.max_persons} personer</span>
          </div>
        )}

        <AccommodationInfoDialog
          accommodationRooms={trip.accommodation_rooms}
          accommodationSizeSqm={trip.accommodation_size_sqm}
          accommodationFacilities={trip.accommodation_facilities}
          accommodationAddress={trip.accommodation_address}
          accommodationDescription={trip.accommodation_description}
          tripName={trip.name}
        />

        {/* Flight Details */}
        {flightLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Hämtar flyginformation...</span>
          </div>
        )}
        {flightOffer && !flightLoading && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full group">
              <Plane className="w-4 h-4" />
              <span>Flyginfo – {flightOffer.airline}</span>
              {flightOffer.airline_logo && (
                <img src={flightOffer.airline_logo} alt={flightOffer.airline} className="h-4 w-auto ml-auto mr-1" />
              )}
              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/50 rounded-lg p-3 mt-2 space-y-2">
                {flightOffer.slices?.map((slice, i) => (
                  <div key={i} className="text-xs text-muted-foreground space-y-0.5">
                    <div className="font-medium text-foreground/80">
                      {i === 0 ? "Utresa" : "Hemresa"}: {slice.origin} → {slice.destination}
                    </div>
                    <div>
                      Avgång: {new Date(slice.departure_time).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      Ankomst: {new Date(slice.arrival_time).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {slice.stops > 0 && (
                      <div className="text-destructive">{slice.stops} mellanlandning</div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
