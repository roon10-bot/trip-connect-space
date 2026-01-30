import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Star, Users } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";
import { BookingWidget } from "./BookingWidget";

export const Hero = () => {
  return (
    <section className="relative aspect-video flex flex-col">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center container mx-auto px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-current" />
              Betrodd av över 10 000 resenärer
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-bold text-primary-foreground mb-6 leading-tight"
          >
            Drömmer ni om en{" "}
            <span className="text-primary">oförglömlig</span>{" "}
            studentresa?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Ert livs äventyr väntar runt hörnet, boka din resa redan idag.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/book">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[180px] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Boka direkt
              </Button>
            </Link>
            <Link to="/destinations">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 min-w-[180px] px-8 py-6 text-lg font-semibold backdrop-blur-sm"
              >
                Se våra resor
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-sunset" />
                <span className="text-3xl font-bold text-primary-foreground">50+</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Destinationer</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-sunset" />
                <span className="text-3xl font-bold text-primary-foreground">10k+</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Nöjda kunder</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-sunset fill-sunset" />
                <span className="text-3xl font-bold text-primary-foreground">4.9</span>
              </div>
              <span className="text-sm text-primary-foreground/70">Betyg</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking Widget - positioned to overlap hero bottom */}
      <div className="relative z-20 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="translate-y-1/2"
        >
          <BookingWidget />
        </motion.div>
      </div>
    </section>
  );
};
