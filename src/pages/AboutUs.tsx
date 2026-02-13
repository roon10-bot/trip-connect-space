import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { UserCheck, Shield, TrendingUp, Heart, CheckCircle, Users, Calendar, Phone } from "lucide-react";

const values = [
  {
    icon: UserCheck,
    title: "Tydlig planering från start till hemkomst",
  },
  {
    icon: Phone,
    title: "Personlig kontakt genom hela processen",
  },
  {
    icon: Users,
    title: "Eget team på plats under resan",
  },
  {
    icon: Calendar,
    title: "Snabb återkoppling och transparens",
  },
];

const qualities = [
  "Noggrant utvalda boenden",
  "Strukturerade säkerhetsrutiner",
  "Professionella reseledare",
  "Tydlig kommunikation med både elever och föräldrar",
];

const stats = [
  { value: "150+", label: "Resenärer 2025" },
  { value: "450+", label: "Resenärer 2026" },
  { value: "100%", label: "Genomförda resor" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-32 bg-accent overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-primary/10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 container mx-auto px-4 text-center max-w-4xl"
        >
          <p className="text-primary font-medium tracking-wider uppercase text-sm mb-4">Om oss</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            Vi skapar studentresor vi själva hade velat åka på.
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Studentresor är mer än en resa. Det är avslutet på en epok – och början på något nytt.
          </p>
        </motion.div>
      </section>

      {/* Intro */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="space-y-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              En modern researrangör med personligt ansvar
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Vi grundade Studentresor med en tydlig vision: att höja nivån på studentresor i Sverige. Mindre massproduktion. Mer kvalitet. Mer närvaro. Mer upplevelse.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Vi är en svensk researrangör som arbetar nära elevkårer och studentkommittéer.
              Hos oss finns inga callcenters eller opersonliga system – du har direktkontakt med människor som faktiskt ansvarar för din resa.
            </p>
            <p className="text-foreground font-serif text-xl font-bold italic">
              Vi bygger relationer, inte volym.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What every school gets */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.h2
            {...fadeUp}
            className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4"
          >
            Varje skola vi samarbetar med får
          </motion.h2>
          <motion.p {...fadeUp} className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Vi ger alla våra samarbetspartners den uppmärksamhet de förtjänar.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-foreground font-medium text-sm">{v.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Kvalitet framför kvantitet
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Vi väljer att arbeta med ett begränsat antal skolor varje år.
              Det gör att vi kan vara närvarande – på riktigt.
            </p>
          </motion.div>
          <motion.div {...fadeUp} className="space-y-4">
            {qualities.map((q, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/40"
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{q}</span>
              </motion.div>
            ))}
          </motion.div>
          <motion.p
            {...fadeUp}
            className="text-foreground font-serif text-xl font-bold italic text-center mt-12"
          >
            Vi kompromissar aldrig med tryggheten – och vi kompromissar aldrig med upplevelsen.
          </motion.p>
        </div>
      </section>

      {/* Safety */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              Trygghet & ansvar
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
              <p>
                Studentresor är en svensk researrangör med ställd resegaranti enligt Kammarkollegiets krav.
              </p>
              <p>
                Vi följer gällande lagstiftning för paketresor och har tydliga säkerhetsrutiner på varje destination.
                Vårt team är tillgängligt dygnet runt under hela resan.
              </p>
              <p className="text-foreground font-medium italic">
                För oss är trygghet inte en punkt i marknadsföringen – det är en självklarhet.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-accent">
        <div className="container mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-16">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              En resa i tillväxt
            </h2>
            <p className="text-white/70 max-w-xl mx-auto">
              Sedan starten har vi vuxit snabbt genom rekommendationer och återkommande samarbeten.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-12">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-5xl font-serif font-bold text-primary mb-2">{s.value}</p>
                <p className="text-white/70 text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp} className="text-center space-y-2">
            <p className="text-white/80">Vi är inte störst.</p>
            <p className="text-white font-serif font-bold text-lg">
              Men vi är på väg att bli Sveriges mest uppskattade studentresearrangör.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Ambition */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div {...fadeUp} className="text-center">
            <Heart className="w-8 h-8 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              Vår ambition
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              Vi vill förändra hur studentresor upplevs – både av elever och av skolor.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              Genom närvaro, struktur och kvalitet bygger vi en ny standard för studentresor i Sverige.
            </p>
            <p className="text-foreground font-serif text-2xl font-bold italic">
              Det här är bara början.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
