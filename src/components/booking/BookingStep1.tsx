import { motion } from "framer-motion";
import { Users, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingStep1Props {
  travelers: number;
  setTravelers: (value: number) => void;
  maxPersons: number;
  discountCode: string;
  setDiscountCode: (value: string) => void;
  appliedDiscount: {
    code: string;
    percent: number | null;
    amount: number | null;
  } | null;
  applyDiscountCode: () => void;
  removeDiscount: () => void;
  onNext: () => void;
}

export const BookingStep1 = ({
  travelers,
  setTravelers,
  maxPersons,
  discountCode,
  setDiscountCode,
  appliedDiscount,
  applyDiscountCode,
  removeDiscount,
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

          {/* Discount Code */}
          <div className="space-y-4">
            <Label className="text-lg font-medium">Rabattkod</Label>
            {appliedDiscount ? (
              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                <Tag className="w-5 h-5 text-primary" />
                <span className="font-medium text-primary">
                  {appliedDiscount.code}
                  {appliedDiscount.percent && ` (-${appliedDiscount.percent}%)`}
                  {appliedDiscount.amount && ` (-${appliedDiscount.amount} kr)`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeDiscount}
                  className="ml-auto h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ange rabattkod"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={applyDiscountCode} variant="secondary">
                  Tillämpa
                </Button>
              </div>
            )}
          </div>

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
