import { useState } from "react";
import { Plane, ArrowLeft, Loader2, Clock, ArrowRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { FlightOffer } from "@/hooks/useFlightSearch";

interface FlightSelectionStepProps {
  tripName: string;
  offers: FlightOffer[];
  isLoading: boolean;
  guests: number;
  onSelect: (offer: FlightOffer) => void;
  onBack: () => void;
}

const formatTime = (iso: string) => {
  try { return format(new Date(iso), "HH:mm"); } catch { return iso; }
};

const formatDate = (iso: string) => {
  try { return format(new Date(iso), "d MMM", { locale: sv }); } catch { return iso; }
};

const FlightCard = ({
  offer,
  isSelected,
  onSelect,
}: {
  offer: FlightOffer;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const outbound = offer.slices?.[0];
  const inbound = offer.slices?.[1];

  return (
    <div
      className={cn(
        "bg-card rounded-xl border transition-all duration-200 overflow-hidden",
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border hover:border-primary/40 hover:shadow-sm"
      )}
    >
      {/* Main row */}
      <div className="p-4 flex items-center gap-4">
        {/* Airline logo + name */}
        <div className="flex flex-col items-center gap-1 min-w-[60px]">
          {offer.airline_logo ? (
            <img src={offer.airline_logo} alt={offer.airline} className="w-8 h-8 rounded object-contain" />
          ) : (
            <Plane className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-[11px] text-muted-foreground text-center leading-tight">{offer.airline}</span>
        </div>

        {/* Flight legs */}
        <div className="flex-1 space-y-2">
          {outbound && (
            <FlightLeg
              origin={outbound.origin}
              destination={outbound.destination}
              departureTime={outbound.departure_time}
              arrivalTime={outbound.arrival_time}
              duration={outbound.duration}
              stops={outbound.stops}
            />
          )}
          {inbound && (
            <FlightLeg
              origin={inbound.origin}
              destination={inbound.destination}
              departureTime={inbound.departure_time}
              arrivalTime={inbound.arrival_time}
              duration={inbound.duration}
              stops={inbound.stops}
            />
          )}
        </div>

        {/* Price + select */}
        <div className="flex flex-col items-end gap-2 min-w-[130px]">
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">
              {parseFloat(offer.price_per_passenger_sek).toLocaleString("sv-SE")} kr
            </p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={cn(
              "font-semibold transition-all",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-sunset hover:bg-sunset/90 text-accent-foreground"
            )}
          >
            {isSelected ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Valt
              </span>
            ) : (
              "Välj"
            )}
          </Button>
        </div>
      </div>

      {/* Expandable details */}
      <button
        className="w-full px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        Flygdetaljer
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-3 text-sm">
          {outbound && (
            <div>
              <p className="font-medium text-foreground mb-1">Utresa – {formatDate(outbound.departure_time)}</p>
              <p className="text-muted-foreground">
                {outbound.origin_name} ({outbound.origin}) → {outbound.destination_name} ({outbound.destination})
              </p>
              <p className="text-muted-foreground">
                {formatTime(outbound.departure_time)} – {formatTime(outbound.arrival_time)} · {outbound.duration} · {outbound.stops === 0 ? "Direkt" : `${outbound.stops} mellanlandning`}
              </p>
            </div>
          )}
          {inbound && (
            <div>
              <p className="font-medium text-foreground mb-1">Hemresa – {formatDate(inbound.departure_time)}</p>
              <p className="text-muted-foreground">
                {inbound.origin_name} ({inbound.origin}) → {inbound.destination_name} ({inbound.destination})
              </p>
              <p className="text-muted-foreground">
                {formatTime(inbound.departure_time)} – {formatTime(inbound.arrival_time)} · {inbound.duration} · {inbound.stops === 0 ? "Direkt" : `${inbound.stops} mellanlandning`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FlightLeg = ({
  origin,
  destination,
  departureTime,
  arrivalTime,
  duration,
  stops,
}: {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-right min-w-[44px]">
      <p className="text-sm font-semibold text-foreground leading-tight">{formatTime(departureTime)}</p>
      <p className="text-[11px] text-muted-foreground">{origin}</p>
    </div>
    <div className="flex-1 flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground">{duration}</span>
      <div className="w-full flex items-center gap-0.5">
        <div className="h-px flex-1 bg-border" />
        {stops > 0 && (
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
        )}
        {stops > 0 && <div className="h-px flex-1 bg-border" />}
        <ArrowRight className="w-3 h-3 text-muted-foreground -ml-0.5" />
      </div>
      <span className="text-[10px] text-muted-foreground">
        {stops === 0 ? "Direkt" : `${stops} stopp`}
      </span>
    </div>
    <div className="min-w-[44px]">
      <p className="text-sm font-semibold text-foreground leading-tight">{formatTime(arrivalTime)}</p>
      <p className="text-[11px] text-muted-foreground">{destination}</p>
    </div>
  </div>
);

export const FlightSelectionStep = ({
  tripName,
  offers,
  isLoading,
  guests,
  onSelect,
  onBack,
}: FlightSelectionStepProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <Plane className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Söker flyg...</p>
          <p className="text-sm text-muted-foreground mt-1">Vi letar efter de bästa flygalternativen för din resa</p>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Plane className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Inga flyg hittades</p>
          <p className="text-sm text-muted-foreground mt-1">Prova att ändra avgångsort eller datum</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till boenden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Välj ditt flyg</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {offers.length} flygalternativ för <span className="font-medium text-foreground">{tripName}</span> · {guests} {guests === 1 ? "resenär" : "resenärer"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Ändra boende
        </Button>
      </div>

      {/* Cheapest badge */}
      {offers.length > 0 && (
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full">
          <Check className="w-3.5 h-3.5" />
          Billigaste alternativet överst
        </div>
      )}

      {/* Flight cards */}
      <div className="space-y-3">
        {offers.map((offer, i) => (
          <FlightCard
            key={offer.id}
            offer={offer}
            isSelected={selectedId === offer.id}
            onSelect={() => {
              setSelectedId(offer.id);
              onSelect(offer);
            }}
          />
        ))}
      </div>
    </div>
  );
};
