import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";
import { BookingWidget } from "./BookingWidget";

export const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className="relative aspect-video flex flex-col overflow-visible">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={heroVideo}
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center container mx-auto px-4 pt-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Play Button - above text */}
          <AnimatePresence>
            {!isPlaying && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={handlePlay}
                className="mb-6 cursor-pointer group"
                aria-label="Spela video"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative inline-flex"
                >
                  {/* Play icon only - transparent fill */}
                  <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-12 h-12 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" />
                  </div>
                </motion.div>
              </motion.button>
            )}
          </AnimatePresence>
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
                className="bg-white/90 hover:bg-white text-accent min-w-[180px] px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Se våra resor
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Booking Widget - positioned to overlap hero bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <BookingWidget />
        </motion.div>
      </div>
    </section>
  );
};