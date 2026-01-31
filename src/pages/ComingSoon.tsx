import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plane, Mail, Instagram, Facebook } from "lucide-react";
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
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/80 hover:text-primary transition-colors"
          >
            <Instagram className="w-6 h-6" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/80 hover:text-primary transition-colors"
          >
            <Facebook className="w-6 h-6" />
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
