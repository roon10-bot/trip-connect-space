import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Loader2, Shield, CheckCircle, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTurnstile } from "@/hooks/useTurnstile";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import swishLogo from "@/assets/swish-logo.png";

interface BookingStep4PaymentProps {
  bookingFee: number;
  totalPrice: number;
  tripName: string;
  onPrev: () => void;
  onPay: (method: "card" | "swish", turnstileToken: string) => void;
  isProcessing: boolean;
  // Swish result from parent after onPay resolves
  swishResult?: {
    pendingBookingId: string;
    paymentRequestToken: string;
    swishPaymentId: string;
  } | null;
  // Called when booking is confirmed (swish payment completed)
  onBookingConfirmed?: () => void;
  // Primary traveler email for redirect
  primaryEmail?: string;
}

export const BookingStep4Payment = ({
  bookingFee,
  totalPrice,
  tripName,
  onPrev,
  onPay,
  isProcessing,
  swishResult,
  onBookingConfirmed,
  primaryEmail,
}: BookingStep4PaymentProps) => {
  const { containerRef, token: turnstileToken, error: turnstileError } = useTurnstile();
  const [selectedMethod, setSelectedMethod] = useState<"card" | "swish" | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  // Swish polling state
  const [swishPollStatus, setSwishPollStatus] = useState<"polling" | "paid" | "error" | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remainingAmount = totalPrice - bookingFee;

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Start realtime subscription + polling fallback when swishResult arrives
  useEffect(() => {
    if (!swishResult) return;

    const isNativePlatform = Capacitor.isNativePlatform();
    
    // On native, launch Swish app
    if (isNativePlatform) {
      const callbackUrl = encodeURIComponent(window.location.origin + "/dashboard?payment=success");
      const swishUrl = `swish://paymentrequest?token=${swishResult.paymentRequestToken}&callbackurl=${callbackUrl}`;
      
      (async () => {
        try {
          const canOpen = await AppLauncher.canOpenUrl({ url: "swish://" });
          if (canOpen.value) {
            await AppLauncher.openUrl({ url: swishUrl });
          }
        } catch {
          window.location.assign(swishUrl);
        }
      })();
      return;
    }

    // Desktop/mobile web: realtime + polling
    setSwishPollStatus("polling");
    let resolved = false;

    const handleCompleted = () => {
      if (resolved) return;
      resolved = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSwishPollStatus("paid");
      toast.success("Betalningen genomförd! Din bokning bekräftas...");
      const confirmUrl = `/booking/confirmation?pending_booking_id=${swishResult.pendingBookingId}${primaryEmail ? `&email=${encodeURIComponent(primaryEmail)}` : ""}`;
      console.log("[Swish] Confirmed, redirecting to:", confirmUrl);
      setTimeout(() => navigate(confirmUrl), 2000);
    };

    const handleFailed = () => {
      if (resolved) return;
      resolved = true;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSwishPollStatus("error");
      toast.error("Betalningen misslyckades. Försök igen.");
    };

    // 1. Realtime subscription
    const channel = supabase
      .channel(`pending-booking-${swishResult.pendingBookingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pending_trip_bookings",
          filter: `id=eq.${swishResult.pendingBookingId}`,
        },
        (payload) => {
          console.log("[Swish Realtime]", payload.new);
          if (payload.new.status === "completed") handleCompleted();
          else if (payload.new.status === "failed" || payload.new.status === "payment_failed") handleFailed();
        }
      )
      .subscribe((status) => {
        console.log("[Swish Realtime] Channel status:", status);
      });

    // 2. Polling fallback every 2 seconds
    pollIntervalRef.current = setInterval(async () => {
      if (resolved) return;
      try {
        const { data, error } = await supabase
          .from("pending_trip_bookings")
          .select("status")
          .eq("id", swishResult.pendingBookingId)
          .maybeSingle();

        console.log("[Swish Poll]", { status: data?.status, error: error?.message });

        if (error) {
          console.warn("[Swish Poll] Query error:", error.message);
          return;
        }

        if (data?.status === "completed") handleCompleted();
        else if (data?.status === "failed" || data?.status === "payment_failed") handleFailed();
      } catch (e) {
        console.warn("[Swish Poll] Exception:", e);
      }
    }, 2000);

    // Timeout after 5 minutes
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setSwishPollStatus("error");
        toast.error("Tidsgränsen gick ut. Kontrollera Swish-appen och försök igen.");
      }
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [swishResult, onBookingConfirmed, navigate, primaryEmail]);

  const handlePay = () => {
    if (!selectedMethod || !turnstileToken) return;
    onPay(selectedMethod, turnstileToken);
  };

  // If Swish payment is being polled, show Swish status UI
  if (swishResult && swishPollStatus) {
    const isDesktop = !isMobile && !Capacitor.isNativePlatform();
    const qrContent = isDesktop ? `D${swishResult.paymentRequestToken}` : null;
    const swishUrl = `swish://paymentrequest?token=${swishResult.paymentRequestToken}`;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <img src={swishLogo} alt="Swish" className="w-6 h-6 object-contain" />
              {swishPollStatus === "paid" ? "Betalning genomförd!" : "Swish-betalning"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {swishPollStatus === "paid" ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-palm mx-auto mb-4" />
                <p className="text-lg font-semibold">Betalningen bekräftad!</p>
                <p className="text-muted-foreground mt-2">Din bokning slutförs nu...</p>
              </div>
            ) : swishPollStatus === "error" ? (
              <div className="text-center py-6">
                <p className="text-destructive font-medium mb-4">Betalningen kunde inte genomföras</p>
                <Button onClick={() => { setSwishPollStatus(null); }} variant="outline">
                  Försök igen
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop: QR code */}
                {qrContent && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-sm text-center">
                      Skanna QR-koden med Swish-appen
                    </p>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <QRCodeSVG value={qrContent} size={220} />
                    </div>
                    <p className="text-xl font-bold text-primary">
                      {bookingFee.toLocaleString("sv-SE")} kr
                    </p>
                  </div>
                )}

                {/* Mobile web: Open Swish button */}
                {!qrContent && (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-sm text-center">
                      Öppna Swish-appen för att slutföra betalningen
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {bookingFee.toLocaleString("sv-SE")} kr
                    </p>
                    <Button
                      size="lg"
                      className="bg-[#00A7E1] hover:bg-[#0090c4] text-white h-14 px-8"
                      onClick={() => window.location.assign(swishUrl)}
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Öppna Swish
                    </Button>
                  </div>
                )}

                {/* Polling indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Väntar på betalning...</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

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
