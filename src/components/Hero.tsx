import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Play, Pause } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import heroVideo from "@/assets/hero-video.mp4";
import heroOgImage from "/images/studentresor-og.jpg";

const BookingWidget = lazy(() => import("./BookingWidget").then(m => ({ default: m.BookingWidget })));

export const Hero = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [Motion, setMotion] = useState<typeof import("framer-motion") | null>(null);
  useEffect(() => {
    setHasHydrated(true);
    import("framer-motion").then(setMotion);
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

  const m = Motion;

  return (
    <section className="relative min-h-[85vh] md:aspect-video md:min-h-0 flex flex-col overflow-visible">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={heroVideo}
          loop
          muted
          playsInline
          preload="auto"
          poster={heroOgImage}
          className="w-full h-full object-cover"
          style={{ backgroundColor: 'hsl(var(--foreground))' }}
        >
          <track kind="captions" srcLang="sv" label="Svenska" default />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-16 md:flex-1 md:flex md:items-center">
        <div className="max-w-4xl mx-auto text-center">
          {m ? (
            <m.motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={handleTogglePlay}
              className="mb-6 cursor-pointer group"
              aria-label={isPlaying ? t("hero.pauseVideo") : t("hero.playVideo")}
            >
              <m.motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative inline-flex">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <m.AnimatePresence mode="wait">
                    {isPlaying ? (
                      <m.motion.div key="pause" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                        <Pause className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent drop-shadow-lg" />
                      </m.motion.div>
                    ) : (
                      <m.motion.div key="play" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
                        <Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" />
                      </m.motion.div>
                    )}
                  </m.AnimatePresence>
                </div>
              </m.motion.div>
            </m.motion.button>
          ) : (
            <button onClick={handleTogglePlay} className="mb-6 cursor-pointer group" aria-label={isPlaying ? t("hero.pauseVideo") : t("hero.playVideo")}>
              <div className="relative inline-flex">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {isPlaying ? (
                    <Pause className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent drop-shadow-lg" />
                  ) : (
                    <Play className="w-10 h-10 md:w-16 md:h-16 text-white fill-transparent ml-1 drop-shadow-lg" />
                  )}
                </div>
              </div>
            </button>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-3 md:mb-4 leading-tight md:whitespace-nowrap">
            <Trans i18nKey="hero.title">
              Drömmer ni om en <span className="text-primary">oförglömlig</span> studentresa?
            </Trans>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-8 max-w-xl mx-auto leading-relaxed px-2 md:px-0">
            {t("hero.subtitle")}
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 md:bottom-0 left-0 right-0 z-20 container mx-auto px-4 md:translate-y-1/2">
        {m ? (
          <m.motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Suspense fallback={null}><BookingWidget /></Suspense>
          </m.motion.div>
        ) : (
          <Suspense fallback={null}><BookingWidget /></Suspense>
        )}
      </div>
    </section>
  );
};
