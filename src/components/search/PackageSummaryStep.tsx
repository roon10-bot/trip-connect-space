import { ArrowLeft, MapPin, Plane, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { FlightOffer } from "@/hooks/useFlightSearch";
import { calculateSplitPricePerPerson } from "@/lib/paymentCalculations";

interface PackageSummaryStepProps {
  trip: any;
  flightOffer: FlightOffer;
  guests: number;
  onBack: () => void;
}

export const PackageSummaryStep = ({
  trip,
  flightOffer,
  guests,
  onBack,
}: PackageSummaryStepProps) => {
  const flightPricePerPerson = parseFloat(flightOffer.price_per_passenger_sek);

  const computeTotalPerPerson = () => {
    const accommodation = Number(trip.base_price_accommodation) || 0;
    const extras = Number(trip.base_price_extras) || 0;

    if (trip.trip_type === "splitveckan" && guests > 0) {
      const p = calculateSplitPricePerPerson(accommodation, flightPricePerPerson, extras, guests);
      return p > 0 ? p : trip.price;
    }

    return Math.ceil(accommodation * 1.2 + flightPricePerPerson + extras);
  };

  const pricePerPerson = computeTotalPerPerson();
  const totalPrice = pricePerPerson * guests;
  const outbound = flightOffer.slices?.[0];
  const inbound = flightOffer.slices?.[1];

  const formatTime = (iso: string) => {
    try { return format(new Date(iso), "HH:mm"); } catch { return iso; }
  };

  const nights = Math.round(
    (new Date(trip.return_date).getTime() - new Date(trip.departure_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Ditt paket</h2>
          <p className="text-sm text-muted-foreground">Granska innan du bokar</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ändra flyg
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Accommodation section */}
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            Boende
          </h3>
          <p className="font-medium text-foreground">{trip.name}</p>
          {trip.accommodation_address && (
            <p className="text-sm text-muted-foreground mt-1">{trip.accommodation_address}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(trip.departure_date), "d MMM", { locale: sv })} – {format(new Date(trip.return_date), "d MMM yyyy", { locale: sv })}
            </span>
            <span>{nights} nätter</span>
            <span>{guests} resenärer</span>
          </div>
          {trip.accommodation_facilities && trip.accommodation_facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {trip.accommodation_facilities.map((f: string) => (
                <span key={f} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Flight section */}
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Plane className="w-4 h-4 text-primary" />
            Flyg – {flightOffer.airline}
          </h3>
          <div className="space-y-2 text-sm">
            {outbound && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">{outbound.origin} → {outbound.destination}</span>
                <span>{formatTime(outbound.departure_time)} – {formatTime(outbound.arrival_time)}</span>
                <span>({outbound.stops === 0 ? "Direkt" : `${outbound.stops} stopp`})</span>
              </div>
            )}
            {inbound && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">{inbound.origin} → {inbound.destination}</span>
                <span>{formatTime(inbound.departure_time)} – {formatTime(inbound.arrival_time)}</span>
                <span>({inbound.stops === 0 ? "Direkt" : `${inbound.stops} stopp`})</span>
              </div>
            )}
          </div>
        </div>

        {/* Price summary */}
        <div className="p-5 bg-muted/30">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
            <span>Pris per person</span>
            <span>{pricePerPerson.toLocaleString("sv-SE")} SEK</span>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
            <span>{guests} resenärer</span>
            <span>× {guests}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold text-foreground border-t border-border pt-3">
            <span>Totalt</span>
            <span>{totalPrice.toLocaleString("sv-SE")} SEK</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          to={`/book/trip/${trip.id}`}
          state={{
            guests,
            flightPricePerPerson,
            flightOffer,
          }}
        >
          <Button size="lg" className="bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold px-8">
            Gå vidare till bokning
          </Button>
        </Link>
      </div>
    </div>
  );
};
