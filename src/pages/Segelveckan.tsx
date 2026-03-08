import { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Shield, Users, Plane, Home, Calendar, Phone, Anchor, Sun, Utensils, Wifi, Fuel, MapPin, Compass, Ship } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import segelveckanHero from "@/assets/segelveckan-hero.mp4";

const includedIcons = [Plane, Check, Check, Ship, Anchor, Utensils, Fuel, Wifi, Calendar, Phone];

const Segelveckan = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useSEO({
    title: "Segelveckan – Segling på katamaran i Kroatien | Studentresor",
    description: "Segelveckan är Studentresors mest exklusiva studentresa. Segla på katamaran genom Kroatiens skärgård med flyg, boende och event inkluderat. Boka din plats.",
    canonical: "https://www.studentresor.com/segelveckan",
    ogImage: "https://www.studentresor.com/images/segelveckan-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Resor", url: "https://www.studentresor.com/search" },
      { name: "Segelveckan", url: "https://www.studentresor.com/segelveckan" },
    ],
  });

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": "Segelveckan – Segling på katamaran i Kroatien",
      "description": "Segla på katamaran genom Kroatiens skärgård med flyg, boende, mat och event inkluderat.",
      "touristType": "Studentresa",
      "itinerary": {
        "@type": "Place",
        "name": "Kroatien",
        "address": { "@type": "PostalAddress", "addressCountry": "HR" }
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "SEK",
        "url": "https://www.studentresor.com/segelveckan"
      },
      "provider": {
        "@type": "TravelAgency",
        "name": "Studentresor",
        "url": "https://www.studentresor.com"
      }
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const included = t("segelveckan.included", { returnObjects: true }) as string[];
  const itinerary = t("segelveckan.itinerary", { returnObjects: true }) as { day: string; title: string; desc: string }[];
  const events = t("segelveckan.events", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:aspect-video md:min-h-0 flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            src={segelveckanHero}
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-cover"
            style={{ backgroundColor: "hsl(var(--foreground))" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-16 md:flex-1 md:flex md:items-center">
          <div className="max-w-4xl mx-auto text-center">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={handleTogglePlay}
              className="mb-6 cursor-pointer group"
              aria-label={isPlaying ? t("hero.pauseVideo") : t("hero.playVideo")}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative inline-flex">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div key="pause" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                        <Pause className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent drop-shadow-lg" />
                      </motion.div>
                    ) : (
                      <motion.div key="play" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                        <Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.button>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-primary font-semibold text-sm md:text-base uppercase tracking-widest mb-3"
            >
              {t("segelveckan.label")}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight"
            >
              <Trans i18nKey="segelveckan.heroTitle">
                Segelveckan – vår mest <span className="text-primary">exklusiva</span> studentresa
              </Trans>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 md:px-0"
            >
              {t("segelveckan.heroSubtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/search?tripType=seglingsvecka">
                <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-10 py-6">
                  {t("booking.bookYourSpot")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              {t("segelveckan.introTitle")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {t("segelveckan.introP")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto grid md:grid-cols-3 gap-8 mt-12"
          >
            {[
              { title: t("segelveckan.wakeUp"), desc: t("segelveckan.wakeUpDesc") },
              { title: t("segelveckan.morningDip"), desc: t("segelveckan.morningDipDesc") },
              { title: t("segelveckan.sunsets"), desc: t("segelveckan.sunsetsDesc") },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-card rounded-2xl shadow-elegant">
                <h3 className="font-serif font-bold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center text-foreground font-serif font-semibold text-xl mt-12"
          >
            {t("segelveckan.mostExclusive")}
          </motion.p>
        </div>
      </section>

      {/* Kroatien Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              {t("segelveckan.croatiaTitle")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              {t("segelveckan.croatiaP1")}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {t("segelveckan.croatiaP2")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm">
                <Compass className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("segelveckan.routeAdapted")}</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm">
                <Sun className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("segelveckan.everyTripUnique")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Accommodation Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                {t("segelveckan.accommodationTitle")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("segelveckan.accommodationP")}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Users, text: t("segelveckan.gatherOnDeck") },
                { icon: Sun, text: t("segelveckan.relaxInNet") },
                { icon: Anchor, text: t("segelveckan.freedomAtSea") },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 bg-card rounded-xl shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <p className="text-foreground font-serif font-semibold text-xl">
                {t("segelveckan.notHotel")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Skipper Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <Anchor className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              {t("segelveckan.skipperTitle")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              {t("segelveckan.skipperP1")}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              {t("segelveckan.skipperP2")}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("segelveckan.helpSail")}</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("segelveckan.leanBack")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">
              {t("segelveckan.eventsTitle")}
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {events.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl p-4 shadow-sm"
                >
                  <p className="text-foreground font-medium">{event}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-muted-foreground mt-8 text-lg">
              {t("segelveckan.everyDay")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Itinerary Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10 text-center">
              {t("segelveckan.itineraryTitle")}
            </h2>

            <div className="space-y-4">
              {itinerary.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex gap-4 bg-card rounded-xl p-5 shadow-sm"
                >
                  <div className="shrink-0 w-16 text-center">
                    <span className="text-primary font-serif font-bold text-sm">{item.day}</span>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-foreground mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-muted-foreground mt-6 text-sm italic">
              {t("segelveckan.itineraryNote")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Included Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">
              {t("segelveckan.includedTitle")}
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              {included.map((text, i) => {
                const Icon = includedIcons[i] || Check;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-ocean-light flex items-center justify-center">
                      <Icon className="w-4 h-4 text-ocean" />
                    </div>
                    <span className="text-foreground font-medium">{text}</span>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-muted-foreground mt-8 text-lg">
              {t("segelveckan.includedNote")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Safety Section */}
      <section className="py-20 md:py-28 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <Shield className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              {t("segelveckan.safetyTitle")}
            </h2>
            <p className="text-accent-foreground/80 text-lg leading-relaxed mb-6">
              {t("segelveckan.safetyP1")}
            </p>
            <p className="text-accent-foreground/80 text-lg leading-relaxed">
              {t("segelveckan.safetyP2")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              {t("segelveckan.ctaTitle")}
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              {t("segelveckan.ctaP1")}
            </p>
            <p className="text-foreground text-lg font-medium mb-8">
              {t("segelveckan.ctaP2")}
            </p>
            <Link to="/search?tripType=seglingsvecka">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-12 py-6">
                {t("segelveckan.ctaButton")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Segelveckan;
