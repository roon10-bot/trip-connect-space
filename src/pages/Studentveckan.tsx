import { useState, useRef, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Shield, Users, Plane, Ship, Calendar, Phone, Anchor, Sun, Utensils, Fuel, Music, Waves, Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import studentveckanHero from "@/assets/studentveckan-hero.mp4";

const includedIcons = [Plane, Check, Check, Ship, Anchor, Utensils, Fuel, Music, Phone];

const Studentveckan = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useSEO({
    title: "Studentveckan – Segla med 150 studenter i Kroatien",
    description: "Studentveckan är en unik seglingsresa i Kroatien tillsammans med studenter från hela Sverige.",
    canonical: "https://www.studentresor.com/studentveckan",
    ogImage: "https://www.studentresor.com/images/studentveckan-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.com/" },
      { name: "Resor", url: "https://www.studentresor.com/search" },
      { name: "Studentveckan", url: "https://www.studentresor.com/studentveckan" },
    ],
  });

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": "Studentveckan – Segla med 150 studenter i Kroatien",
      "description": "En unik seglingsresa i Kroatien tillsammans med studenter från hela Sverige.",
      "touristType": "Studentresa",
      "itinerary": { "@type": "Place", "name": "Kroatien", "address": { "@type": "PostalAddress", "addressCountry": "HR" } },
      "offers": { "@type": "Offer", "priceCurrency": "SEK", "url": "https://www.studentresor.com/studentveckan" },
      "provider": { "@type": "TravelAgency", "name": "Studentresor", "url": "https://www.studentresor.com" }
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
      else { videoRef.current.play(); setIsPlaying(true); }
    }
  };

  const highlights = t("studentveckan.highlights", { returnObjects: true }) as string[];
  const included = t("studentveckan.included", { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:aspect-video md:min-h-0 flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <video ref={videoRef} src={studentveckanHero} loop muted playsInline preload="none" className="w-full h-full object-cover" style={{ backgroundColor: "hsl(var(--foreground))" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-16 md:flex-1 md:flex md:items-center">
          <div className="max-w-4xl mx-auto text-center">
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} onClick={handleTogglePlay} className="mb-6 cursor-pointer group" aria-label={isPlaying ? t("hero.pauseVideo") : t("hero.playVideo")}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative inline-flex">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div key="pause" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}><Pause className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent drop-shadow-lg" /></motion.div>
                    ) : (
                      <motion.div key="play" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}><Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" /></motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.button>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-primary font-semibold text-sm md:text-base uppercase tracking-widest mb-3">
              {t("studentveckan.label")}
            </motion.p>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight">
              <Trans i18nKey="studentveckan.heroTitle">
                Äventyr. Gemenskap. <span className="text-primary">Livets vecka.</span>
              </Trans>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 md:px-0">
              {t("studentveckan.heroSubtitle")}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Link to="/search?tripType=studentveckan">
                <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-10 py-6">
                  {t("booking.bookYourCabin")}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{t("studentveckan.introTitle")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">{t("studentveckan.introP1")}</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">{t("studentveckan.introP2")}</p>
            <p className="text-muted-foreground text-lg leading-relaxed">{t("studentveckan.introP3")}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} viewport={{ once: true }} className="max-w-2xl mx-auto grid md:grid-cols-3 gap-8 mt-12">
            {[
              { title: t("studentveckan.youBook"), desc: t("studentveckan.youBookDesc") },
              { title: t("studentveckan.weCreate"), desc: t("studentveckan.weCreateDesc") },
              { title: t("studentveckan.youExperience"), desc: t("studentveckan.youExperienceDesc") },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-card rounded-2xl shadow-elegant">
                <h3 className="font-serif font-bold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Days & Evenings Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">{t("studentveckan.weekTitle")}</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 shadow-elegant">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Sun className="w-6 h-6 text-primary" /></div>
              <h3 className="font-serif font-bold text-foreground text-xl mb-3">{t("studentveckan.daysTitle")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("studentveckan.daysP")}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 shadow-elegant">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Music className="w-6 h-6 text-primary" /></div>
              <h3 className="font-serif font-bold text-foreground text-xl mb-3">{t("studentveckan.eveningsTitle")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("studentveckan.eveningsP")}</p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} viewport={{ once: true }} className="text-center mt-10">
            <p className="text-foreground font-serif font-semibold text-xl">{t("studentveckan.everyDayNew")}</p>
            <p className="text-muted-foreground mt-2">{t("studentveckan.routeAdapted")}</p>
          </motion.div>
        </div>
      </section>

      {/* Partnership Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{t("studentveckan.partnerTitle")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t("studentveckan.partnerSubtitle")}</p>
          </motion.div>

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 shadow-elegant">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Anchor className="w-6 h-6 text-primary" /></div>
              <h3 className="font-serif font-bold text-foreground text-lg mb-3">{t("studentveckan.yachtDays")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("studentveckan.yachtDaysP")}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="bg-card rounded-2xl p-8 shadow-elegant">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Heart className="w-6 h-6 text-primary" /></div>
              <h3 className="font-serif font-bold text-foreground text-lg mb-3">{t("studentveckan.studentresor")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("studentveckan.studentresorP")}</p>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} viewport={{ once: true }} className="text-center text-foreground font-serif font-semibold text-xl mt-10">
            {t("studentveckan.partnerQuote")}
          </motion.p>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">{t("studentveckan.highlightsTitle")}</h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {highlights.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }} className="bg-card rounded-xl p-4 shadow-sm">
                  <p className="text-foreground font-medium">{item}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-foreground font-serif font-semibold text-xl mt-10">{t("studentveckan.highlightsQuote")}</p>
          </motion.div>
        </div>
      </section>

      {/* Included Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">{t("studentveckan.includedTitle")}</h2>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              {included.map((text, i) => {
                const Icon = includedIcons[i] || Check;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }} viewport={{ once: true }} className="flex items-center gap-3 p-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{text}</span>
                  </motion.div>
                );
              })}
            </div>

            <p className="text-foreground font-serif font-semibold text-lg mt-8">{t("studentveckan.includedNote")}</p>
          </motion.div>
        </div>
      </section>

      {/* Beginner Friendly Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <Waves className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">{t("studentveckan.beginnerTitle")}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">{t("studentveckan.beginnerP1")}</p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t("studentveckan.beginnerP2")}</p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("studentveckan.bookAlone")}</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{t("studentveckan.bookWithFriends")}</span>
              </div>
            </div>
            <p className="text-foreground font-serif font-semibold text-xl mt-8">{t("studentveckan.beginnerQuote")}</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Safety Section */}
      <section className="py-20 md:py-28 bg-accent text-accent-foreground">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <Shield className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">{t("studentveckan.safetyTitle")}</h2>
            <p className="text-accent-foreground/80 text-lg leading-relaxed mb-6">{t("studentveckan.safetyP1")}</p>
            <p className="text-accent-foreground/80 text-lg leading-relaxed">{t("studentveckan.safetyP2")}</p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{t("studentveckan.ctaTitle")}</h2>
            <p className="text-muted-foreground text-lg mb-4">{t("studentveckan.ctaP1")}</p>
            <p className="text-foreground text-lg font-medium mb-8">{t("studentveckan.ctaP2")}</p>
            <Link to="/search?tripType=studentveckan">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-12 py-6">
                {t("studentveckan.ctaButton")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Studentveckan;
