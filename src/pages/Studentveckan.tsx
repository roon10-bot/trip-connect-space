import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Check, Shield, Users, Plane, Ship, Calendar, Phone, Anchor, Sun, Utensils, Fuel, Music, Waves, Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import studentveckanHero from "@/assets/studentveckan-hero.mp4";

const includedItems = [
  { icon: Plane, text: "Flyg tur & retur" },
  { icon: Check, text: "Incheckat bagage" },
  { icon: Check, text: "Transfer till och från flygplats" },
  { icon: Ship, text: "En vecka på modern segelbåt" },
  { icon: Anchor, text: "Erfaren skeppare" },
  { icon: Utensils, text: "Frukost, lunch och dryck" },
  { icon: Fuel, text: "Hamnavgifter & diesel" },
  { icon: Music, text: "Organiserade event" },
  { icon: Phone, text: "24/7 service på plats" },
];

const highlights = [
  "Fester ute till havs",
  "DJ på utvalda kvällar",
  "Snorkling i turkosa vikar",
  "Middagar i historiska hamnstäder",
  "Bad direkt från båten",
  "Nya vänner från hela Sverige",
];

const Studentveckan = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
            src={studentveckanHero}
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
              Studentveckan
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight"
            >
              Äventyr. Gemenskap. <span className="text-primary">Livets vecka.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed px-2 md:px-0"
            >
              Glöm allt du vet om vanliga studentresor. Segla genom Kroatiens övärld med studenter från hela Sverige.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/search?tripType=studentveckan">
                <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-10 py-6">
                  Boka din hytt
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
              Vad är Studentveckan?
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Studentveckan är ett nytt koncept från Studentresor i samarbete med Yacht Days – skapat för dig som vill resa med fler än bara din egen klass.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Här möts studenter från hela Sverige på en gemensam seglingsupplevelse. Ta med din bästa vän, hela kompisgänget – eller kom själv och lär känna nya människor redan första kvällen.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Du bor på en modern segelbåt och seglar mellan Kroatiens öar tillsammans med andra studenter. Varje dag bjuder på nya platser, nya upplevelser och nya människor.
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
              { title: "Du bokar", desc: "en hytt." },
              { title: "Vi skapar", desc: "veckan." },
              { title: "Du upplever", desc: "livet." },
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
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">
              Så ser veckan ut
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-elegant"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sun className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-xl mb-3">Dagarna</h3>
              <p className="text-muted-foreground leading-relaxed">
                Salta dopp i kristallklara vikar. Snorkling, SUP, sol och bad. Upptäck små hamnstäder och ät lunch vid vattnet.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-elegant"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-xl mb-3">Kvällarna</h3>
              <p className="text-muted-foreground leading-relaxed">
                Middag i hamn, häng på däck och organiserade event med DJ, ljus och festmiljö när solen går ner.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-foreground font-serif font-semibold text-xl">
              Varje dag är ny. Varje kväll är annorlunda.
            </p>
            <p className="text-muted-foreground mt-2">
              Rutten anpassas efter väder och vind – vilket gör varje vecka unik.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Partnership Section */}
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
              Studentresor × Yacht Days
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Studentveckan är ett samarbete mellan Studentresor och Yacht Days.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-elegant"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Anchor className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-lg mb-3">Yacht Days</h3>
              <p className="text-muted-foreground leading-relaxed">
                Expertisen till havs – moderna båtar, erfarna skeppare och säker navigation genom Kroatiens skärgård.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 shadow-elegant"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-foreground text-lg mb-3">Studentresor</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upplevelsen – aktiviteter, event och stämning som förvandlar veckan till något mer än bara en resa.
              </p>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center text-foreground font-serif font-semibold text-xl mt-10"
          >
            Tillsammans skapar vi en trygg, organiserad och oförglömlig studentupplevelse.
          </motion.p>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-10">
              Vad kan du förvänta dig?
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {highlights.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-xl p-4 shadow-sm"
                >
                  <p className="text-foreground font-medium">{item}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-foreground font-serif font-semibold text-xl mt-10">
              Detta är veckan du kommer prata om hela sommaren.
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
              Det här ingår i Studentveckan
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

            <p className="text-foreground font-serif font-semibold text-lg mt-8">
              Allt är planerat. Du behöver bara dyka upp.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Beginner Friendly Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <Waves className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              Ny på segling? Perfekt.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Du behöver inga förkunskaper.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Studentveckan är skapad för studenter – oavsett om du aldrig varit på en båt tidigare eller om du älskar havet.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Boka en hytt själv</span>
              </div>
              <div className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">Eller boka med ditt gäng</span>
              </div>
            </div>
            <p className="text-foreground font-serif font-semibold text-xl mt-8">
              Resten tar vi hand om.
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
              Studentresor är en svensk researrangör med ställd resegaranti enligt Kammarkollegiets krav. Under hela veckan finns vårt team tillgängligt dygnet runt.
            </p>
            <p className="text-accent-foreground/80 text-lg leading-relaxed">
              Tillsammans med Yacht Days säkerställer vi säker navigation, strukturerade event och tydliga rutiner – både till havs och i hamn.
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
              Är du redo för Studentveckan?
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              Platserna är begränsade.
            </p>
            <p className="text-foreground text-lg font-medium mb-8">
              Säkra din hytt och upplev veckan du aldrig kommer glömma.
            </p>
            <Link to="/search?tripType=studentveckan">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 text-primary-foreground text-lg px-12 py-6">
                Boka Studentveckan
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
