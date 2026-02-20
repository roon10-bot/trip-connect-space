import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";
import heroVideo from "@/assets/hero-video.mp4";
import { BookingWidget } from "./BookingWidget";

export const Hero = () => {
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
    <section className="relative min-h-[85vh] md:aspect-video md:min-h-0 flex flex-col overflow-visible">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={heroVideo}
          loop
          muted
          playsInline
          preload="none"
          className="w-full h-full object-cover"
          style={{ backgroundColor: 'hsl(var(--foreground))' }}
        >
          <track kind="captions" srcLang="sv" label="Svenska" default />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-16 md:flex-1 md:flex md:items-center">
        <div className="max-w-4xl mx-auto text-center">
          {/* Play/Pause Button - above text */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={handleTogglePlay}
            className="mb-6 cursor-pointer group"
            aria-label={isPlaying ? "Pausa video" : "Spela video"}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex"
            >
              {/* Play/Pause icon - transparent fill */}
              <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="pause"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Pause className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent drop-shadow-lg" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.button>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight md:whitespace-nowrap"
          >
            Drömmer ni om en <span className="text-primary">oförglömlig</span> studentresa?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed px-2 md:px-0"
          >
            Ert livs äventyr väntar runt hörnet, boka din resa redan idag.
          </motion.p>

        </div>
      </div>

      {/* Booking Widget - at bottom on mobile, overlapping on desktop */}
      <div className="absolute bottom-4 md:bottom-0 left-0 right-0 z-20 container mx-auto px-4 md:translate-y-1/2">
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