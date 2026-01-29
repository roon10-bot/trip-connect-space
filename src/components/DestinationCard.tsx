import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DestinationCardProps {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  priceFrom: number;
  rating: number;
  featured?: boolean;
  index?: number;
}

export const DestinationCard = ({
  id,
  name,
  country,
  description,
  imageUrl,
  priceFrom,
  rating,
  featured,
  index = 0,
}: DestinationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-elegant hover:shadow-lg transition-all duration-500"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full bg-sunset text-accent-foreground text-xs font-semibold">
              Populär
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
          <Star className="w-4 h-4 text-sunset fill-sunset" />
          <span className="text-sm font-semibold text-foreground">{rating}</span>
        </div>

        {/* Location */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-primary-foreground">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{country}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-serif font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-sm text-muted-foreground">Från</span>
            <p className="text-2xl font-bold text-primary">
              {priceFrom.toLocaleString("sv-SE")} kr
            </p>
          </div>
          <Link to={`/book/${id}`}>
            <Button
              variant="default"
              className="bg-gradient-ocean hover:opacity-90 transition-opacity"
            >
              Boka nu
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
