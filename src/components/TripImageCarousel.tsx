import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripImageCarouselProps {
  images: { id: string; image_url: string }[];
  fallbackImage?: string | null;
  className?: string;
}

export const TripImageCarousel = ({ 
  images, 
  fallbackImage,
  className 
}: TripImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use fallback if no images
  const allImages = images.length > 0 
    ? images 
    : fallbackImage 
      ? [{ id: "fallback", image_url: fallbackImage }] 
      : [];

  if (allImages.length === 0) {
    return (
      <div className={cn("bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-sm">Ingen bild</span>
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={cn("relative group overflow-hidden", className)}>
      <img
        src={allImages[currentIndex].image_url}
        alt={`Resebild ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-300"
      />

      {/* Navigation arrows - only show if more than 1 image */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Föregående bild"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Nästa bild"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  index === currentIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Gå till bild ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
