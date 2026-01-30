import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-4 leading-tight whitespace-nowrap"
          >
            Drömmer ni om en <span className="text-primary">oförglömlig</span> studentresa?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Ert livs äventyr väntar runt hörnet, boka din resa redan idag.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
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