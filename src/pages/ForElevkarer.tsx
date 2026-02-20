import { Header } from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Calendar, Gift, CheckCircle, ArrowRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/elevkarer-hero.jpg";
import { MeetingBookingForm } from "@/components/MeetingBookingForm";

const benefits = [
  {
    icon: Users,
    title: "Skräddarsydda gruppresor",
    description:
      "Vi anpassar resan efter er grupp – oavsett om ni är 20 eller 200 personer. Ni bestämmer datum, destination och upplägg.",
  },
  {
    icon: Calendar,
    title: "Enkel planering",
    description:
      "Vi sköter allt det praktiska – från flyg och boende till aktiviteter och fester. Ni behöver bara samla gänget.",
  },
  {
    icon: Gift,
    title: "Förmånliga grupppriser",
    description:
      "Ju fler ni är, desto bättre pris. Vi erbjuder specialpriser och bonusar för elevkårer och studentkommittéer.",
  },
  {
    icon: CheckCircle,
    title: "Trygg & säker resa",
    description:
      "Vi har resegaranti, försäkringar och personal på plats under hela resan. Er trygghet är vår prioritet.",
  },
];

const steps = [
  { number: "01", title: "Kontakta oss", description: "Berätta om er grupp och era önskemål." },
  { number: "02", title: "Vi skräddarsyr", description: "Vi sätter ihop ett förslag anpassat efter er." },
  { number: "03", title: "Samla gruppen", description: "Dela länken så bokar alla individuellt." },
  { number: "04", title: "Res iväg!", description: "Vi tar hand om resten – njut av resan." },
];

const ForElevkarer = () => {
  useSEO({
    title: "Studentresor för elevkårer & studentkommittéer | Studentresor",
    description: "Planera en studentresa med din elevkår eller studentkommitté. Skräddarsydda gruppresor till Kroatien med Studentresor. Boka ett möte idag.",
    canonical: "https://www.studentresor.se/for-skolor",
    ogImage: "https://www.studentresor.se/images/elevkarer-og.jpg",
    breadcrumbs: [
      { name: "Hem", url: "https://www.studentresor.se/" },
      { name: "För elevkårer", url: "https://www.studentresor.se/for-skolor" },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Segelbåtar i Kroatiens skärgård"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            För elevkårer & studentkommittéer
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Planera en oförglömlig studentresa för hela gänget. Vi hjälper er från start till mål
            med skräddarsydda grupplösningar.
          </p>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Varför resa med oss?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vi har skickat hundratals studentgrupper på drömresor. Här är varför elevkårer och
              kommittéer väljer Studentresor.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-5 p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-16"
          >
            Så fungerar det
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Boka ett videosamtal
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Välj en tid som passar er så berättar vi mer om hur vi kan hjälpa er elevkår eller studentkommitté.
            </p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            <MeetingBookingForm />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Vill ni hellre prata direkt?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Kontakta oss via formuläret så återkommer vi inom kort.
            </p>
            <Link to="/kontakt">
              <Button size="lg" className="bg-gradient-ocean hover:opacity-90 gap-2">
                Kontakta oss
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
