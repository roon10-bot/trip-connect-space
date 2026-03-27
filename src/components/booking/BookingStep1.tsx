import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingStep1Props {
  travelers: number;
  setTravelers: (value: number) => void;
  maxPersons: number;
  onNext: () => void;
}

export const BookingStep1 = ({
  travelers,
  setTravelers,
  maxPersons,
  onNext,
}: BookingStep1Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Välj antal resenärer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Number of Travelers */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Antal resenärer</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => travelers > 1 && setTravelers(travelers - 1)}
                disabled={travelers <= 1}
                className="h-12 w-12"
              >
                -
              </Button>
              <div className="flex items-center gap-2 text-2xl font-semibold min-w-[80px] justify-center">
                <Users className="w-6 h-6 text-primary" />
                {travelers}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => travelers < maxPersons && setTravelers(travelers + 1)}
                disabled={travelers >= maxPersons}
                className="h-12 w-12"
              >
                +
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Du kan ange rabattkoder för varje resenär i nästa steg.
          </p>

          {/* Next Button */}
          <div className="pt-4">
            <Button
              onClick={onNext}
              size="lg"
              className="w-full bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
            >
              Fortsätt till resenärinformation
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
