import { Header } from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { UserCheck, Shield, TrendingUp, Heart, CheckCircle, Users, Calendar, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const icons = [UserCheck, Phone, Users, Calendar];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const AboutUs = () => {
  const { t } = useTranslation();

  useSEO({
    title: "Om Studentresor – Studentlife Sweden AB | Studentresor",
    description: "Lär känna Studentresor och teamet bakom Sveriges studentresor till Kroatien.",
    canonical: "https://www.studentresor.com/om-oss",
    ogImage: "https://www.studentresor.com/images/om-oss-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Om oss", url: "https://www.studentresor.com/om-oss" },
    ],
  });

  const values = (t("about.values", { returnObjects: true }) as string[]);
  const qualities = (t("about.qualities", { returnObjects: true }) as string[]);
  const stats = (t("about.stats", { returnObjects: true }) as { value: string; label: string }[]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 bg-accent overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-primary/10" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          <p className="text-primary font-medium tracking-wider uppercase text-sm mb-4">{t("about.label")}</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">{t("about.heroTitle")}</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">{t("about.heroSubtitle")}</p>
        </motion.div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="space-y-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">{t("about.introTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{t("about.introP1")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("about.introP2")}</p>
            <p className="text-foreground font-serif text-xl font-bold italic">{t("about.introQuote")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4">{t("about.schoolTitle")}</motion.h2>
          <motion.p {...fadeUp} className="text-muted-foreground text-center max-w-xl mx-auto mb-16">{t("about.schoolSubtitle")}</motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  {(() => { const Icon = icons[i]; return <Icon className="w-6 h-6 text-primary" />; })()}
                </div>
                <p className="text-foreground font-medium text-sm">{v}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t("about.qualityTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{t("about.qualitySubtitle")}</p>
          </motion.div>
          <motion.div {...fadeUp} className="space-y-4">
            {qualities.map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{q}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.p {...fadeUp} className="text-foreground font-serif text-xl font-bold italic text-center mt-12">{t("about.qualityQuote")}</motion.p>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{t("about.safetyTitle")}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>{t("about.safetyP1")}</p>
              <p>{t("about.safetyP2")}</p>
              <p className="text-foreground font-medium italic">{t("about.safetyQuote")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-accent">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-16">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">{t("about.statsTitle")}</h2>
            <p className="text-white/70 max-w-xl mx-auto">{t("about.statsSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-12">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <p className="text-5xl font-serif font-bold text-primary mb-2">{s.value}</p>
                <p className="text-white/70 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp} className="text-center space-y-2">
            <p className="text-white/80">{t("about.statsP1")}</p>
            <p className="text-white font-serif font-bold text-lg">{t("about.statsP2")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center">
            <Heart className="w-8 h-8 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{t("about.ambitionTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">{t("about.ambitionP1")}</p>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">{t("about.ambitionP2")}</p>
            <p className="text-foreground font-serif text-2xl font-bold italic">{t("about.ambitionQuote")}</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
