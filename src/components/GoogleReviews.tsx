import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Emma Lindqvist",
    avatar: "E",
    rating: 5,
    text: "Fantastisk upplevelse! Allt var perfekt organiserat och servicen var outstanding. Rekommenderar starkt!",
    date: "2 veckor sedan",
  },
  {
    name: "Johan Andersson",
    avatar: "J",
    rating: 5,
    text: "Bästa resebolaget jag någonsin använt. Smidigt, proffsigt och prisvärt. Bokar definitivt igen!",
    date: "1 månad sedan",
  },
  {
    name: "Sofia Bergström",
    avatar: "S",
    rating: 5,
    text: "Otroligt nöjd med min resa till Barcelona. Studentresor fixade allt och supporten var tillgänglig dygnet runt.",
    date: "1 månad sedan",
  },
  {
    name: "Marcus Ek",
    avatar: "M",
    rating: 4,
    text: "Mycket bra upplevelse! Enkelt att boka och fantastiskt boende. Kommer använda igen.",
    date: "2 månader sedan",
  },
  {
    name: "Lisa Johansson",
    avatar: "L",
    rating: 5,
    text: "Perfekt för studentbudget! Prisvärda resor med hög kvalitet. Tack för en minnesvärd resa!",
    date: "2 månader sedan",
  },
];

export const GoogleReviews = () => {
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="pt-32 pb-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header with Google branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-xl font-medium text-foreground">Google Reviews</span>
          </div>
          
          {/* Rating summary */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">{averageRating}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
          </div>
          <p className="text-muted-foreground">Baserat på {reviews.length} recensioner</p>
        </motion.div>

        {/* Reviews grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-6 shadow-elegant border border-border"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{review.name}</h4>
                  <p className="text-sm text-muted-foreground">{review.date}</p>
                </div>
              </div>
              
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-foreground/80 text-sm leading-relaxed">
                {review.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
