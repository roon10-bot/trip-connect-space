import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedDestinations } from "@/components/FeaturedDestinations";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Clock, HeartHandshake, Headphones } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Säker bokning",
      description: "Alla betalningar är krypterade och dina uppgifter skyddade",
    },
    {
      icon: Clock,
      title: "Flexibel avbokning",
      description: "Ändra eller avboka din resa upp till 24 timmar innan avresa",
    },
    {
      icon: HeartHandshake,
      title: "Personlig service",
      description: "Dedikerad reserådgivare som hjälper dig genom hela resan",
    },
    {
      icon: Headphones,
      title: "24/7 support",
      description: "Vi finns här för dig dygnet runt, var du än befinner dig",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedDestinations />

      {/* Features Section - added padding-top to account for overlapping widget */}
      <section className="pt-40 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-ocean font-medium text-sm uppercase tracking-wider mb-4 block">
              Varför välja oss
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Resor utan bekymmer
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Vi tar hand om alla detaljer så att du kan fokusera på det viktigaste – 
              att njuta av din resa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="inline-flex p-4 rounded-2xl bg-ocean-light group-hover:bg-ocean transition-colors duration-300 mb-6">
                  <feature.icon className="w-8 h-8 text-ocean group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80"
            alt="Naturvy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 to-foreground/70" />
        </div>
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary-foreground mb-6">
              Redo att påbörja ditt nästa äventyr?
            </h2>
            <p className="text-primary-foreground/80 text-xl mb-8">
              Skapa ett konto idag och få tillgång till exklusiva erbjudanden 
              och personliga reserekommendationer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-sunset hover:bg-sunset/90 text-accent-foreground font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Skapa gratis konto
              </a>
              <a
                href="/destinations"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-lg transition-all"
              >
                Utforska destinationer
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
