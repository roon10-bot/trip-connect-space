import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Shield, Users, Plane, Home, Calendar, Phone, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import splitveckanHero from "@/assets/splitveckan-hero.mp4";

const includedItems = [
  { icon: Plane, text: "Flyg tur & retur" },
  { icon: Check, text: "Incheckat bagage" },
  { icon: Check, text: "Transfer till och från flygplatsen" },
  { icon: Home, text: "Centralt boende i lägenhet eller hotell" },
  { icon: Calendar, text: "Planerade event under veckan" },
  { icon: Phone, text: "24/7 service på plats" },
  { icon: Users, text: "Svensk reseledarorganisation" },
];

const Splitveckan = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useSEO({
    title: "Splitveckan – Studentresa till Split, Kroatien | Studentresor",
    description: "Splitveckan är studentresan till Split med centralt boende, strandliv och nattliv i världsklass. Flyg, boende och event ingår. Boka din plats hos Studentresor.",
    canonical: "https://www.studentresor.se/splitveckan",
    ogImage: "https://www.studentresor.se/images/splitveckan-og.jpg",
  });

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
            src={splitveckanHero}
            loop
            muted
            playsInline
            preload="auto"
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
              Splitveckan
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight"
            >
              Sol, fest och frihet i hjärtat av <span className="text-primary">Kroatien</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 md:px-0"
            >
              En vecka i Split med ditt kompisgäng – där strandliv på dagen möter nattliv i världsklass på kvällen.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/search?tripType=splitveckan">
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
              En vecka du aldrig glömmer
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Föreställ dig kristallklart vatten, soliga dagar på Bačvice och Firule, spontana förfester i lägenheten och kvällar fyllda av musik, energi och nya människor från hela Sverige.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Split är en av Europas mest populära studentdestinationer – och vi har byggt Splitveckan för att ge dig det bästa av staden, utan krångel.
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
              { title: "På dagarna", desc: "Beach clubs, bad och stadspuls." },
              { title: "På kvällarna", desc: "Arrangerade event, strandbarer och klubbar." },
              { title: "Däremellan", desc: "Friheten att bara vara med ditt gäng." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-card rounded-2xl shadow-elegant">
                <h3 className="font-serif font-bold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Accommodation Section */}
      <section className="py-20 md:py-28 bg-muted/30">
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
                Bo tillsammans – på riktigt
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Våra främsta boenden är noggrant utvalda lägenheter i centrala Split. Här bor du tillsammans med ditt kompisgäng – inte med främlingar.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: Home, text: "Eget kök, vardagsrum och privat utrymme" },
                { icon: Users, text: "Bo med ditt gäng – inte med okända" },
                { icon: MapPin, text: "Gångavstånd till strand, stad och nattliv" },
                { icon: Shield, text: "Handplockade för läge, standard och trygghet" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 p-5 bg-card rounded-xl shadow-sm"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">{item.text}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-muted-foreground mt-8 text-sm">
              Ingen hotellkorridor-känsla. Ingen delning med okända. Bara frihet, gemenskap och ert tempo.
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
              Det här ingår i Splitveckan
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
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-muted-foreground mt-8 text-lg">
              Vi tar hand om logistiken – du fokuserar på upplevelsen.
            </p>
          </motion.div>
        </div>
      </section>

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
              Studentresor är en svensk researrangör med ställd resegaranti enligt Kammarkollegiets krav. Under hela veckan finns vårt team på plats i Split, tillgängliga dygnet runt.
            </p>
            <p className="text-accent-foreground/80 text-lg leading-relaxed">
              Vi arbetar med tydliga säkerhetsrutiner och strukturerade event för att skapa en trygg miljö – både för dig och för dina föräldrar.
            </p>
            <p className="text-accent-foreground font-serif font-semibold text-xl mt-8">
              Trygghet är en självklarhet. Upplevelsen är vårt signum.
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
              Är du redo för Splitveckan?
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              Platserna är begränsade varje år.
            </p>
            <p className="text-foreground text-lg font-medium mb-8">
              Säkra din plats och upplev studenten på riktigt – med ditt gäng, i hjärtat av Split.
            </p>
            <Link to="/search?tripType=splitveckan">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-12 py-6">
                Boka nu
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Splitveckan;
