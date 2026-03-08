import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Calendar, Gift, CheckCircle, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/elevkarer-hero.jpg";
import { MeetingBookingForm } from "@/components/MeetingBookingForm";

const benefitIcons = [Users, Calendar, Gift, CheckCircle];

const ForElevkarer = () => {
  const { t } = useTranslation();

  useSEO({
    title: "Studentresor för elevkårer & studentkommittéer | Studentresor",
    description: "Planera en studentresa med din elevkår eller studentkommitté. Skräddarsydda gruppresor till Kroatien med Studentresor.",
    canonical: "https://www.studentresor.com/for-skolor",
    ogImage: "https://www.studentresor.com/images/elevkarer-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "För elevkårer", url: "https://www.studentresor.com/for-skolor" },
    ],
  });

  const benefits = t("forSchools.benefits", { returnObjects: true }) as { title: string; description: string }[];
  const steps = t("forSchools.steps", { returnObjects: true }) as { number: string; title: string; description: string }[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img src={heroImage} alt="Segelbåtar i Kroatiens skärgård" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">{t("forSchools.heroTitle")}</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">{t("forSchools.heroSubtitle")}</p>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t("forSchools.whyTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("forSchools.whySubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((b, i) => {
              const Icon = benefitIcons[i] || CheckCircle;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }} className="flex gap-5 p-6 rounded-xl border border-border bg-card">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-16">
            {t("forSchools.howTitle")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <span className="text-5xl font-serif font-bold text-primary/20">{s.number}</span>
                <h3 className="text-lg font-bold text-foreground mt-2 mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meeting booking */}
      <section className="py-24 bg-background" id="boka-mote">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center mb-12">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t("forSchools.meetingTitle")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("forSchools.meetingSubtitle")}</p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            <MeetingBookingForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t("forSchools.ctaTitle")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">{t("forSchools.ctaSubtitle")}</p>
            <Link to="/kontakt">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 gap-2">
                {t("forSchools.ctaButton")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForElevkarer;
