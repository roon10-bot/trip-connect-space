import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BookingEmailVerificationProps {
  email: string;
  onContinue: () => void;
}

export const BookingEmailVerification = ({ email, onContinue }: BookingEmailVerificationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="shadow-elegant overflow-hidden">
        <div className="bg-gradient-ocean p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
          >
            <Mail className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">
            Konto skapat!
          </h2>
          <p className="text-white/80 text-sm">
            Nästan klart — verifiera din e-post för att fortsätta
          </p>
        </div>

        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Verifieringsmail skickat</span>
            </div>
            <p className="text-muted-foreground">
              Vi har skickat ett verifieringsmail till{" "}
              <span className="font-semibold text-foreground">{email}</span>.
              Klicka på länken i mailet för att verifiera ditt konto.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Hittar du inte mailet?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Kolla din skräppost/spam-mapp</li>
              <li>• Mailet kan ta upp till 2 minuter</li>
              <li>• Kontrollera att e-postadressen stämmer</li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
            >
              Fortsätt med bokningen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Du behöver verifiera e-post och vara inloggad innan betalning.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
