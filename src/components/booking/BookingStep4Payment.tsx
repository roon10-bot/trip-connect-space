import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, Smartphone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTurnstile } from "@/hooks/useTurnstile";
import swishLogo from "@/assets/swish-logo.png";

interface BookingStep4PaymentProps {
  bookingFee: number;
  totalPrice: number;
  tripName: string;
  onPrev: () => void;
  onPay: (method: "card" | "swish", turnstileToken: string) => void;
  isProcessing: boolean;
}

export const BookingStep4Payment = ({
  bookingFee,
  totalPrice,
  tripName,
  onPrev,
  onPay,
  isProcessing,
}: BookingStep4PaymentProps) => {
  const { containerRef, token: turnstileToken, error: turnstileError } = useTurnstile();
  const [selectedMethod, setSelectedMethod] = useState<"card" | "swish" | null>(null);

  const remainingAmount = totalPrice - bookingFee;

  const handlePay = () => {
    if (!selectedMethod || !turnstileToken) return;
    onPay(selectedMethod, turnstileToken);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Payment Summary */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Betala bokningsavgift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            För att slutföra din bokning behöver du betala bokningsavgiften nu.
            Resterande belopp betalas enligt betalningsplanen.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Totalt resepris</span>
              <span className="font-medium">{totalPrice.toLocaleString("sv-SE")} kr</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="font-semibold">Bokningsavgift att betala nu</span>
              <span className="text-xl font-bold text-primary">
                {bookingFee.toLocaleString("sv-SE")} kr
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Återstående att betala senare</span>
              <span>{remainingAmount.toLocaleString("sv-SE")} kr</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Välj betalmetod</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Card option */}
          <button
            type="button"
            onClick={() => setSelectedMethod("card")}
            disabled={isProcessing}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
              selectedMethod === "card"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Kortbetalning</p>
              <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "card" ? "border-primary" : "border-muted-foreground/30"
              }`}
            >
              {selectedMethod === "card" && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>

          {/* Swish option */}
          <button
            type="button"
            onClick={() => setSelectedMethod("swish")}
            disabled={isProcessing}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
              selectedMethod === "swish"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <img src={swishLogo} alt="Swish" className="w-6 h-6 object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Swish</p>
              <p className="text-sm text-muted-foreground">Betala med Swish-appen</p>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "swish" ? "border-primary" : "border-muted-foreground/30"
              }`}
            >
              {selectedMethod === "swish" && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
        <Shield className="w-4 h-4" />
        <span>Säker betalning via krypterad anslutning</span>
      </div>

      {/* Turnstile CAPTCHA */}
      <div className="flex flex-col items-center gap-2">
        <div ref={containerRef} />
        {turnstileError && (
          <p className="text-sm text-destructive">
            Säkerhetsverifiering misslyckades. Ladda om sidan och försök igen.
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="flex-1 h-14"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Button
          onClick={handlePay}
          size="lg"
          className="flex-1 bg-sunset hover:bg-sunset/90 text-accent-foreground text-lg font-semibold h-14"
          disabled={isProcessing || !selectedMethod || !turnstileToken}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Betala {bookingFee.toLocaleString("sv-SE")} kr
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
