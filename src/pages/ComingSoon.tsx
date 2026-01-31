import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plane, Mail } from "lucide-react";
import { toast } from "sonner";
import logoSvg from "@/assets/studentresor-logo.svg";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate submission - in production, save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Tack! Vi hör av oss när vi lanserar.");
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-ocean flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 text-primary/20"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Plane className="w-16 h-16 md:w-24 md:h-24" />
      </motion.div>
      <motion.div
        className="absolute bottom-32 right-10 text-primary/20"
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Plane className="w-12 h-12 md:w-20 md:h-20" />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-lg z-10"
      >
        {/* Logo */}
        <motion.img
          src={logoSvg}
          alt="Studentresor"
          className="h-16 md:h-20 mx-auto mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        {/* Heading */}
        <h1 className="font-serif text-4xl md:text-6xl text-primary-foreground mb-4">
          Kommer snart
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl mb-8">
          Vi bygger något fantastiskt för studenter som älskar att resa. 
          Bli först med att få veta när vi lanserar!
        </p>

        {/* Email signup */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Din e-postadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 bg-background/95 border-0 text-foreground"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isSubmitting ? "Skickar..." : "Notifiera mig"}
          </Button>
        </form>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-primary-foreground/60 text-sm">Följ oss:</span>
          <a
            href="https://www.instagram.com/studentresor.se/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/80 hover:text-primary transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@studentresor.se"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/80 hover:text-primary transition-colors"
            aria-label="TikTok"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 text-primary-foreground/50 text-sm"
      >
        © 2025 Studentresor. Alla rättigheter reserverade.
      </motion.p>
    </div>
  );
};

export default ComingSoon;
