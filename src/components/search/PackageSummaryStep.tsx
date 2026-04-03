import { ArrowLeft, MapPin, Plane, Check, Calendar, Users, Edit2 } from "lucide-react";
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
  onBackToStart: () => void;
}

export const PackageSummaryStep = ({
  trip,
  flightOffer,
  guests,
  onBack,
  onBackToStart,
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Granska ditt paket</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Kontrollera att allt stämmer innan du bokar</p>
      </div>

      {/* Package card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Accommodation */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-primary" />
              </div>
              Boende
            </h3>
            <button
              onClick={onBackToStart}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Ändra
            </button>
          </div>

          <p className="font-medium text-foreground text-lg">{trip.name}</p>
          {trip.accommodation_address && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.accommodation_address}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(trip.departure_date), "d MMM", { locale: sv })} – {format(new Date(trip.return_date), "d MMM", { locale: sv })}
            </span>
            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
              {nights} nätter
            </span>
            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
              <Users className="w-3.5 h-3.5" />
              {guests} {guests === 1 ? "resenär" : "resenärer"}
            </span>
          </div>

          {trip.accommodation_facilities && trip.accommodation_facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {trip.accommodation_facilities.map((f: string) => (
                <span key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3 text-primary" />
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Flight */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="w-3.5 h-3.5 text-primary" />
              </div>
              Flyg – {flightOffer.airline}
            </h3>
            <button
              onClick={onBack}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Ändra
            </button>
          </div>

          <div className="space-y-3">
            {outbound && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase tracking-wide min-w-[50px] text-center">Ut</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{formatTime(outbound.departure_time)}</span>
                  <span className="text-muted-foreground">{outbound.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{formatTime(outbound.arrival_time)}</span>
                  <span className="text-muted-foreground">{outbound.destination}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {outbound.stops === 0 ? "Direkt" : `${outbound.stops} stopp`}
                  </span>
                </div>
              </div>
            )}
            {inbound && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase tracking-wide min-w-[50px] text-center">Hem</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-foreground">{formatTime(inbound.departure_time)}</span>
                  <span className="text-muted-foreground">{inbound.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold text-foreground">{formatTime(inbound.arrival_time)}</span>
                  <span className="text-muted-foreground">{inbound.destination}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {inbound.stops === 0 ? "Direkt" : `${inbound.stops} stopp`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Price summary */}
        <div className="p-5 bg-muted/20">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Boende + flyg per person</span>
              <span>{pricePerPerson.toLocaleString("sv-SE")} kr</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Antal resenärer</span>
              <span>× {guests}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold text-foreground">Totalt pris</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{totalPrice.toLocaleString("sv-SE")} kr</span>
                <p className="text-xs text-muted-foreground">inkl. flyg och boende</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Link
          to={`/book/trip/${trip.id}`}
          state={{
            guests,
            flightPricePerPerson,
            flightOffer,
          }}
        >
          <Button size="lg" className="bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold px-8 shadow-md">
            Gå vidare till bokning
          </Button>
        </Link>
      </div>
    </div>
  );
};
