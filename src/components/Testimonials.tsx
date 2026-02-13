import { motion } from "framer-motion";
import { Star } from "lucide-react";

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
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
            Vad säger våra resenärer?
          </h2>
          <p className="text-muted-foreground text-sm">
            Blandat från Google och Trustpilot
          </p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-6 shadow-sm flex flex-col min-w-[280px] sm:min-w-[320px] snap-start shrink-0"
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
