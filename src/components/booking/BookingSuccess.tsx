import { motion } from "framer-motion";
import { CheckCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export const BookingSuccess = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <Card className="shadow-elegant max-w-md w-full text-center">
        <CardContent className="pt-10 pb-8 px-8 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-3xl font-serif font-bold text-foreground">
              Bokning lyckad!
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <p className="text-lg">
                Inom kort får du ett mail från oss. Tack!
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Link to="/">
              <Button size="lg" className="w-full bg-gradient-ocean hover:opacity-90">
                Tillbaka till startsidan
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" size="lg" className="w-full">
                Sök fler resor
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
