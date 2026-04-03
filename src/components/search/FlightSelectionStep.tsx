import { useState } from "react";
import { Plane, ArrowLeft, Loader2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import type { FlightOffer } from "@/hooks/useFlightSearch";

interface FlightSelectionStepProps {
  tripName: string;
  offers: FlightOffer[];
  isLoading: boolean;
  onSelect: (offer: FlightOffer) => void;
  onBack: () => void;
}

export const FlightSelectionStep = ({
  tripName,
  offers,
  isLoading,
  onSelect,
  onBack,
}: FlightSelectionStepProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const formatTime = (iso: string) => {
    try {
      return format(new Date(iso), "HH:mm");
    } catch {
      return iso;
    }
  };

  const formatDate = (iso: string) => {
    try {
      return format(new Date(iso), "d MMM", { locale: sv });
    } catch {
      return iso;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Söker efter flyg...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Plane className="w-12 h-12 mx-auto text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Inga flyg hittades för denna resa.</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till boenden
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Välj flyg</h2>
          <p className="text-sm text-muted-foreground">{tripName} – {offers.length} flygalternativ</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const outbound = offer.slices?.[0];
          const inbound = offer.slices?.[1];
          const isSelected = selectedId === offer.id;

          return (
            <button
              key={offer.id}
              className={cn(
                "w-full text-left bg-card rounded-xl border p-4 transition-all duration-200 hover:shadow-md",
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-md"
                  : "border-border"
              )}
              onClick={() => {
                setSelectedId(offer.id);
                onSelect(offer);
              }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Flight info */}
                <div className="flex-1 space-y-3">
                  {/* Outbound */}
                  {outbound && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        {offer.airline_logo && (
                          <img src={offer.airline_logo} alt={offer.airline} className="w-6 h-6 rounded" />
                        )}
                        <span className="text-xs text-muted-foreground">{offer.airline}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{formatTime(outbound.departure_time)}</p>
                          <p className="text-xs text-muted-foreground">{outbound.origin}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center px-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {outbound.duration}
                          </span>
                          <div className="w-full h-px bg-border relative my-1">
                            <ArrowRight className="w-3 h-3 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {outbound.stops === 0 ? "Direkt" : `${outbound.stops} stopp`}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{formatTime(outbound.arrival_time)}</p>
                          <p className="text-xs text-muted-foreground">{outbound.destination}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inbound */}
                  {inbound && (
                    <div className="flex items-center gap-3">
                      <div className="min-w-[100px]" />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{formatTime(inbound.departure_time)}</p>
                          <p className="text-xs text-muted-foreground">{inbound.origin}</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center px-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {inbound.duration}
                          </span>
                          <div className="w-full h-px bg-border relative my-1">
                            <ArrowRight className="w-3 h-3 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {inbound.stops === 0 ? "Direkt" : `${inbound.stops} stopp`}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-foreground">{formatTime(inbound.arrival_time)}</p>
                          <p className="text-xs text-muted-foreground">{inbound.destination}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="text-right min-w-[120px]">
                  <p className="text-xl font-bold text-foreground">
                    {parseFloat(offer.price_per_passenger_sek).toLocaleString("sv-SE")} SEK
                  </p>
                  <p className="text-xs text-muted-foreground">per person</p>
                  {isSelected && (
                    <span className="inline-block mt-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Valt
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
