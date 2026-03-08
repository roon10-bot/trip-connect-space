import { motion } from "framer-motion";
import { Anchor, MapPin, Ship } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const packageIcons = [Anchor, MapPin, Ship];
const packageKeys = ["segelveckan", "splitveckan", "studentveckan"] as const;
const packageHrefs = ["/segelveckan", "/splitveckan", "/studentveckan"];

export const TripPackages = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">{t("packages.title")}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{t("packages.subtitle")}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packageKeys.map((key, index) => {
            const Icon = packageIcons[index];
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }}>
                <Link to={packageHrefs[index]} className="group block bg-card rounded-xl p-8 shadow-elegant hover:shadow-lg transition-all duration-300 border border-border">
                  <div className="w-14 h-14 rounded-xl bg-ocean-light flex items-center justify-center mb-6 group-hover:bg-ocean/20 transition-colors">
                    <Icon className="w-7 h-7 text-ocean" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-foreground mb-4">{t(`packages.${key}.title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{t(`packages.${key}.description`)}</p>
                  <span className="text-primary font-semibold text-sm group-hover:underline">{t("booking.moreInfo")}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
