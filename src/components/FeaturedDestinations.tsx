import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { DestinationCard } from "./DestinationCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const FeaturedDestinations = () => {
  const { data: destinations, isLoading } = useQuery({
    queryKey: ["featured-destinations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("featured", true)
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sunset font-medium text-sm uppercase tracking-wider mb-4 block">
            Våra favoriter
          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
            Populära destinationer
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Utforska våra mest eftertraktade resmål, handplockade för 
            oförglömliga upplevelser och magiska minnen.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <div className="p-6 bg-card">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations?.map((destination, index) => (
              <DestinationCard
                key={destination.id}
                id={destination.id}
                name={destination.name}
                country={destination.country}
                description={destination.description || ""}
                imageUrl={destination.image_url || ""}
                priceFrom={Number(destination.price_from)}
                rating={Number(destination.rating)}
                featured={destination.featured || false}
                index={index}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/destinations">
            <Button
              variant="outline"
              size="lg"
              className="group border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Se alla destinationer
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
