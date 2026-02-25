import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Shield, Users, Plane, Home, Calendar, Phone, Anchor, Sun, Utensils, Wifi, Fuel, MapPin, Compass, Ship } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import segelveckanHero from "@/assets/segelveckan-hero.mp4";

const includedItems = [
  { icon: Plane, text: "Flyg tur & retur" },
  { icon: Check, text: "Incheckat bagage" },
  { icon: Check, text: "Transfer till och från flygplats" },
  { icon: Ship, text: "Modern katamaran (1 vecka)" },
  { icon: Anchor, text: "Erfaren skeppare" },
  { icon: Utensils, text: "Frukost & lunch ombord" },
  { icon: Fuel, text: "Hamnavgifter & diesel" },
  { icon: Wifi, text: "Obegränsat Wi-Fi ombord" },
  { icon: Calendar, text: "Planerade event" },
  { icon: Phone, text: "24/7 service på plats" },
];

const itinerary = [
  { day: "Dag 1", title: "Ankomst & avsegling", desc: "Transfer från Split Airport till Trogir. Ombordstigning och segling mot första destinationen. Gemensam välkomstmiddag i hamn." },
  { day: "Dag 2", title: "Split & nattliv", desc: "Segling mot Split och gemensam kväll på Vanilla Club." },
  { day: "Dag 3", title: "Hvar & Carpe Diem", desc: "Day party på Hvar, middag i hamnen och fest på Carpe Diem." },
  { day: "Dag 4", title: "Circle Party", desc: "Båtarna samlas i formation i en skyddad vik för bad, musik och gemenskap." },
  { day: "Dag 5", title: "Stari Grad", desc: "Sol, bad och kväll i charmig kustmiljö." },
  { day: "Dag 6", title: "Avslutningskväll", desc: "Sista gemensamma festen i Split." },
  { day: "Dag 7", title: "Hemresa", desc: "Segling tillbaka mot Trogir och transfer till flygplatsen." },
];

const Segelveckan = () => {
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
              aria-label={isPlaying ? "Pausa video" : "Spela video"}
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
              Segelveckan
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight"
            >
              Segelveckan – vår mest <span className="text-primary">exklusiva</span> studentresa
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 md:px-0"
            >
              Sju dagar på egen katamaran genom Kroatiens magiska skärgård. Sol, kristallklart vatten och oförglömliga kvällar – upplev studenten från havet.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/search?tripType=seglingsvecka">
                <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-10 py-6">
                  Boka din plats
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
              En premiumupplevelse till havs
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Segelveckan är mer än en resa – det är en unik upplevelse genom Adriatiska havet. Under sju dagar bor du på en modern katamaran och seglar mellan Kroatiens mest ikoniska öar, badvikar och kuststäder.
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
              { title: "Vakna upp", desc: "i en ny hamn varje morgon." },
              { title: "Morgondopp", desc: "direkt från båten." },
              { title: "Solnedgångar", desc: "från däck varje kväll." },
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
            Det här är vår mest exklusiva studentresa.
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
              Upplev Kroatien från havet
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Kroatien är känt som landet med över tusen öar och en av Europas vackraste kustlinjer. Den skyddade skärgården, det lugna havet och de många soltimmarna gör området till ett av världens bästa seglingsdestinationer.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Under veckan seglar vi mellan öar som Hvar, Vis och Stari Grad – genom turkosa vikar, levande hamnar och historiska kuststäder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm">
                <Compass className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Rutten anpassas efter väder och vind.</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl px-5 py-3 shadow-sm">
                <Sun className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Varje resa är unik.</span>
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
                Bo på havet – tillsammans
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Ni bor på rymliga och moderna katamaraner med flera hytter, badrum och generösa ytor för umgänge.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Users, text: "Samlas på däck inför kvällen" },
                { icon: Sun, text: "Koppla av i nätet mellan skroven" },
                { icon: Anchor, text: "Njut av friheten att bo mitt på havet" },
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
                Det här är inte hotell. Det är frihet.
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
              Med erfarna skeppare ombord
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Du behöver inga förkunskaper för att följa med.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Våra välutbildade skeppare ansvarar för navigation, säkerhet och planering. De känner till de bästa badvikarna, restaurangerna och dolda pärlorna längs kusten.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Vill du hjälpa till att segla? Du är välkommen.</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Vill du luta dig tillbaka? Njut av en bekymmersfri vecka.</span>
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
              En vecka fylld av upplevelser
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                "Day party på Hvar",
                "Circle Party till havs",
                "Besök på ikoniska strandklubbar",
                "Middagar i historiska kuststäder",
                "Avslutningsfest i Split",
              ].map((event, i) => (
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
              Varje dag bjuder på nya miljöer, nya intryck och nya minnen.
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
              Exempel på veckoupplägg
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
              Observera: Rutten kan anpassas efter väder och förutsättningar.
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
              Detta ingår i Segelveckan
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              {includedItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-ocean-light flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-ocean" />
                  </div>
                  <span className="text-foreground font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-muted-foreground mt-8 text-lg">
              All logistik är inkluderad – du fokuserar på upplevelsen.
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
              Trygghet & organisation
            </h2>
            <p className="text-accent-foreground/80 text-lg leading-relaxed mb-6">
              Studentresor är en svensk researrangör med ställd resegaranti enligt Kammarkollegiets krav.
            </p>
            <p className="text-accent-foreground/80 text-lg leading-relaxed">
              Under hela veckan finns vårt team tillgängligt. Säkerhet, struktur och tydliga rutiner är en självklar del av vår organisation – både till havs och i hamn.
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
              Är du redo för Segelveckan?
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              Platserna är begränsade varje år.
            </p>
            <p className="text-foreground text-lg font-medium mb-8">
              Säkra din plats och upplev studenten från havet.
            </p>
            <Link to="/search?tripType=seglingsvecka">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-12 py-6">
                Boka Segelveckan
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
