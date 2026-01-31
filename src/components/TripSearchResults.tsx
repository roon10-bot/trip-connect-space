import { motion } from "framer-motion";
import { Calendar, MapPin, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Trip {
  id: string;
  name: string;
  trip_type: string;
  departure_date: string;
  return_date: string;
  departure_location: string;
  first_payment_amount: number;
  second_payment_amount: number;
  final_payment_amount: number;
  description: string | null;
  capacity: number;
}

interface TripSearchResultsProps {
  trips: Trip[];
  isLoading: boolean;
}

export const TripSearchResults = ({ trips, isLoading }: TripSearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (trips.length === 0) {
    return null;
  }

  const getTotalPrice = (trip: Trip) => {
    return trip.first_payment_amount + trip.second_payment_amount + trip.final_payment_amount;
  };

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-4"
    >
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">
        Tillgängliga resor ({trips.length})
      </h3>
      
      {trips.map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-xl p-6 shadow-elegant border border-border hover:shadow-lg transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Trip Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded-full bg-ocean-light text-primary text-xs font-medium">
                  {formatTripType(trip.trip_type)}
                </span>
              </div>
              
              <h4 className="text-2xl font-serif font-bold text-foreground mb-3">
                {trip.name}
              </h4>
              
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    {format(new Date(trip.departure_date), "d MMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMM yyyy", { locale: sv })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  <span className="text-sm">Avgång från {trip.departure_location}</span>
                </div>
              </div>

              {trip.description && (
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {trip.description}
                </p>
              )}
            </div>

            {/* Price and CTA */}
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Totalpris</span>
                <p className="text-3xl font-bold text-primary">
                  {getTotalPrice(trip).toLocaleString("sv-SE")} kr
                </p>
              </div>
              
              <Link to={`/book/trip/${trip.id}`}>
                <Button className="bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold px-8">
                  Boka resa
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
