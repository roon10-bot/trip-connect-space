import { motion } from "framer-motion";
import { Anchor, MapPin, Ship } from "lucide-react";
import { Link } from "react-router-dom";

const packages = [
  {
    title: "Seglingsveckan",
    description:
      "Följ med på en episk vecka till havs där du bor på båt, hoppar mellan öar och festar i solnedgången. Seglingsveckan är för dig som vill ha frihet, vackra vyer och ett helt unikt äventyr.",
    icon: Anchor,
    href: "/segelveckan",
  },
  {
    title: "Splitveckan",
    description:
      "Bo mitt i Split med gångavstånd till både strand och nattliv. Här blandas beachhäng, dagsfester och klubbar i ett oslagbart tempo. Splitveckan är för dig som vill ha allt – på ett och samma ställe.",
    icon: MapPin,
    href: "/splitveckan",
  },
  {
    title: "Studentveckan",
    description:
      "Tillsammans med Yacht Days bjuder Studentresor in dig till en vecka du aldrig glömmer. Segla genom Kroatiens övärld med sol, bad, fester och nya vänner tillsammans med 150 studenter från hela Sverige.",
    icon: Ship,
    href: "/studentveckan",
  },
];

export const TripPackages = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Våra Resor
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Oavsett om du drömmer om öppet hav eller pulserande stadsliv har vi en resa för dig. 
            Våra resepaket i Kroatien är skapade för att maxa din studentupplevelse – med sol, fest, 
            gemenskap och minnen för livet.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link
                to={pkg.href}
                className="group block bg-card rounded-xl p-8 shadow-elegant hover:shadow-lg transition-all duration-300 border border-border"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <pkg.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">
                  {pkg.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {pkg.description}
                </p>
                <span className="text-primary font-semibold text-sm group-hover:underline">
                  Mer info →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
