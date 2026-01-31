import { motion } from "framer-motion";
import { Calendar, Plane, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TripImageCarousel } from "./TripImageCarousel";

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
  base_price?: number | null;
}

interface TripImage {
  id: string;
  trip_id: string;
  image_url: string;
  display_order: number;
}

interface TripSearchResultsProps {
  trips: Trip[];
  isLoading: boolean;
}

export const TripSearchResults = ({ trips, isLoading }: TripSearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-2/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  // Fetch all trip images for these trips
  const tripIds = trips.map(t => t.id);
  const { data: allTripImages } = useQuery({
    queryKey: ["trip-images-search", tripIds],
    queryFn: async () => {
      if (tripIds.length === 0) return [];
      const { data, error } = await supabase
        .from("trip_images")
        .select("*")
        .in("trip_id", tripIds)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TripImage[];
    },
    enabled: tripIds.length > 0,
  });

  // Group images by trip_id
  const imagesByTrip = (allTripImages || []).reduce((acc, img) => {
    if (!acc[img.trip_id]) acc[img.trip_id] = [];
    acc[img.trip_id].push(img);
    return acc;
  }, {} as Record<string, TripImage[]>);

  if (trips.length === 0) {
    return null;
  }

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  // Sort trips by departure date
  const sortedTrips = [...trips].sort(
    (a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <h3 className="text-xl font-serif font-semibold text-foreground mb-4">
        Tillgängliga resor ({trips.length})
      </h3>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {sortedTrips.map((trip, index) => (
            <CarouselItem key={trip.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl overflow-hidden shadow-elegant border border-border hover:shadow-lg transition-all duration-300 h-full flex flex-col"
              >
                {/* Trip Image Carousel */}
                <TripImageCarousel 
                  images={imagesByTrip[trip.id] || []}
                  fallbackImage={trip.image_url}
                  className="h-52"
                />
                
                <div className="p-5 flex flex-col flex-1">
                  {/* Trip Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full bg-ocean-light text-primary text-xs font-medium">
                      {formatTripType(trip.trip_type)}
                    </span>
                  </div>
                  
                  {/* Trip Name */}
                  <h4 className="text-xl font-serif font-bold text-foreground mb-3">
                    {trip.name}
                  </h4>
                  
                  {/* Trip Details */}
                  <div className="space-y-2 text-muted-foreground flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        {format(new Date(trip.departure_date), "d MMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMM yyyy", { locale: sv })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">Avgång från {trip.departure_location}</span>
                    </div>

                    {trip.description && (
                      <p className="text-sm line-clamp-2 mt-2">
                        {trip.description}
                      </p>
                    )}
                  </div>

                  {/* Price and CTA */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {trip.trip_type === "splitveckan" && trip.base_price ? "Pris/person" : "Pris"}
                        </span>
                        {trip.trip_type === "splitveckan" && trip.base_price && trip.min_persons && trip.max_persons ? (
                          <div>
                            <p className="text-xl font-bold text-primary">
                              {Math.ceil((Number(trip.base_price) * 1.20) / Number(trip.max_persons)).toLocaleString("sv-SE")} - {Math.ceil((Number(trip.base_price) * 1.20) / Number(trip.min_persons)).toLocaleString("sv-SE")} kr
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {trip.min_persons}-{trip.max_persons} personer
                            </span>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-primary">
                            {trip.price.toLocaleString("sv-SE")} kr
                          </p>
                        )}
                      </div>
                      
                      <Link to={`/book/trip/${trip.id}`}>
                        <Button className="bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold px-6">
                          Boka resa
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {sortedTrips.length > 3 && (
          <>
            <CarouselPrevious className="-left-4 bg-card border-border hover:bg-muted" />
            <CarouselNext className="-right-4 bg-card border-border hover:bg-muted" />
          </>
        )}
      </Carousel>
    </motion.div>
  );
};
