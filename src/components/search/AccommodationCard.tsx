import { MapPin, Check, Plane, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TripImageCarousel } from "@/components/TripImageCarousel";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { getSplitPricePerPerson, calculateSplitPricePerPerson } from "@/lib/paymentCalculations";

interface TripImage {
  id: string;
  trip_id: string;
  image_url: string;
  display_order: number;
}

interface Trip {
  id: string;
  name: string;
  trip_type: string;
  departure_date: string;
  return_date: string;
  departure_location: string;
  price: number;
  description: string | null;
  capacity: number;
  image_url: string | null;
  min_persons?: number | null;
  max_persons?: number | null;
  base_price_accommodation?: number;
  base_price_flight?: number;
  base_price_extras?: number;
  is_fullbooked?: boolean;
  use_duffel_flights?: boolean;
  accommodation_rooms?: number | null;
  accommodation_size_sqm?: number | null;
  accommodation_facilities?: string[] | null;
  accommodation_address?: string | null;
  accommodation_description?: string | null;
}

interface AccommodationCardProps {
  trip: Trip;
  images: TripImage[];
  cheapestFlightPrice: number | null;
  flightLoading: boolean;
  guests: number;
  isSelected?: boolean;
  onHover?: (tripId: string | null) => void;
  departureIATA?: string;
  flightOffer?: any;
}

const getNights = (dep: string, ret: string) => {
  const d1 = new Date(dep);
  const d2 = new Date(ret);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

export const AccommodationCard = ({
  trip,
  images,
  cheapestFlightPrice,
  flightLoading,
  guests,
  isSelected,
  onHover,
  departureIATA,
  flightOffer,
}: AccommodationCardProps) => {
  const nights = getNights(trip.departure_date, trip.return_date);

  const computePrice = () => {
    const tripUsesDuffel = trip.use_duffel_flights !== false;
    const effectiveFlightPrice = tripUsesDuffel ? cheapestFlightPrice : null;

    if (effectiveFlightPrice && trip.trip_type === "splitveckan" && guests > 0) {
      const accommodation = Number(trip.base_price_accommodation) || 0;
      const extras = Number(trip.base_price_extras) || 0;
      const dynamicPrice = calculateSplitPricePerPerson(accommodation, effectiveFlightPrice, extras, guests);
      return dynamicPrice > 0 ? dynamicPrice : trip.price;
    }
    if (effectiveFlightPrice) {
      const accommodation = Number(trip.base_price_accommodation) || 0;
      const extras = Number(trip.base_price_extras) || 0;
      return Math.ceil(accommodation * 1.2 + effectiveFlightPrice + extras);
    }
    if (trip.trip_type === "splitveckan" && trip.max_persons) {
      const p = getSplitPricePerPerson(trip, Number(trip.max_persons));
      return p > 0 ? p : trip.price;
    }
    return trip.price;
  };

  const displayPrice = computePrice();
  const departureLabel = trip.departure_location?.charAt(0).toUpperCase() + trip.departure_location?.slice(1);

  return (
    <div
      className={cn(
        "flex bg-card rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-lg",
        isSelected ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border shadow-sm"
      )}
      onMouseEnter={() => onHover?.(trip.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image */}
      <div className="w-56 flex-shrink-0 relative">
        <TripImageCarousel
          images={images}
          fallbackImage={trip.image_url}
          mainImageUrl={trip.image_url}
          tripName={trip.name}
          className="h-full min-h-[200px]"
        />
        {trip.is_fullbooked && (
          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground font-bold text-sm px-4 py-1 rounded-full">
              Fullbokat
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <h3 className="text-lg font-bold text-foreground leading-tight">{trip.name}</h3>

        {trip.accommodation_address && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{trip.accommodation_address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-primary" />
            {nights} övernattningar
          </span>
          {trip.accommodation_facilities?.slice(0, 2).map((f) => (
            <span key={f} className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-primary" />
              {f}
            </span>
          ))}
        </div>

        {departureIATA && trip.use_duffel_flights !== false && (
          <div className="mt-2 text-sm">
            <span className="flex items-center gap-1 text-primary font-medium">
              <Plane className="w-3.5 h-3.5" />
              Utgående och ingående returflyg från {departureLabel} ingår
            </span>
          </div>
        )}

        {trip.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{trip.description}</p>
        )}

        <div className="flex-1" />
      </div>

      {/* Price column */}
      <div className="flex flex-col items-end justify-between p-4 pl-2 min-w-[140px] text-right">
        <div>
          {flightLoading && departureIATA ? (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Flygpris...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">
                {displayPrice.toLocaleString("sv-SE")} SEK
              </p>
              <p className="text-xs text-muted-foreground">pp</p>
            </>
          )}
        </div>

        <div className="mt-auto pt-3">
          {trip.is_fullbooked ? (
            <Button disabled size="sm" variant="secondary">
              Fullbokat
            </Button>
          ) : (
            <Link
              to={`/book/trip/${trip.id}`}
              state={{
                guests,
                flightPricePerPerson: cheapestFlightPrice,
                flightOffer: flightOffer || null,
              }}
            >
              <Button size="sm" className="bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold">
                Boka resa
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
