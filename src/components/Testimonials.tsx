import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

const testimonials = [
  {
    name: "Lova Nilsson",
    rating: 5,
    text: "Allt var perfekt, bästa resan nånsin!!",
  },
  {
    name: "Klara",
    rating: 5,
    text: "En fantastisk studentresa! Flera roliga aktiviteter och fester. Rekommenderar!",
  },
  {
    name: "Inez Eking",
    rating: 5,
    text: "Resan till Kroatien med Studentresor var verkligen livets bästa resa 🙏🏻 Vi seglade i en vecka på katamaraner till olika öar runt Split. Sjukt roliga evenemang och fester, nya fräscha båtar och smidig resa dit. Vill göra om det igen!!!",
  },
  {
    name: "Elin P",
    rating: 4,
    text: "Helt klart en av de roligaste resorna jag gjort! Vi var ett gäng tjejer från klassen som åkte och allt från båtarna till kvällarna i hamnarna var superkul. Tyckte det var lite svårt att veta exakt vad som skulle hända första dagen, men annars flöt veckan på riktigt bra. Rekommenderar verkligen till alla som funderar på att åka med studentresor!",
  },
  {
    name: "Noah Lundgren",
    rating: 5,
    text: "Verkligen en resa som jag aldrig kommer att glömma.",
  },
];

export const Testimonials = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Vad säger våra resenärer?
            </h2>
            <p className="text-muted-foreground text-sm">
              Blandat från Google och Trustpilot
            </p>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Föregående"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Nästa"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-6 shadow-sm flex flex-col min-w-0 basis-[85%] sm:basis-[45%] lg:basis-[32%] shrink-0"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s < t.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
                <p className="text-foreground/90 text-sm leading-relaxed flex-1 mb-4">
                  "{t.text}"
                </p>
                <p className="text-foreground font-semibold text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
