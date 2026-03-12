import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AltapayCallback = () => {
  const { status: pathStatus } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const status = pathStatus || searchParams.get("status") || "redirect";
  const pendingBookingId = searchParams.get("pending_booking_id");

  const isSuccess = status === "ok" || status === "redirect";
  const isFail = status === "fail";

  // Poll pending_trip_bookings for status change (completed = booking finalized)
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [tripBookingId, setTripBookingId] = useState<string | null>(null);

  const { data: pendingBooking } = useQuery({
    queryKey: ["pending-booking-poll", pendingBookingId],
    queryFn: async () => {
      if (!pendingBookingId) return null;
      const { data } = await supabase
        .from("pending_trip_bookings")
        .select("status, booking_data")
        .eq("id", pendingBookingId)
        .maybeSingle();
      return data;
    },
    enabled: !!pendingBookingId && isSuccess && !bookingConfirmed,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (pendingBooking?.status === "completed") {
      setBookingConfirmed(true);
    }
  }, [pendingBooking]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(t("dashboard.paymentSuccess"));
    } else if (isFail) {
      toast.error(t("dashboard.paymentFailed"));
    }

    // If no pending booking tracking or failed, redirect after delay
    if (isFail || !pendingBookingId) {
      const timer = setTimeout(() => navigate("/dashboard"), 3000);
      return () => clearTimeout(timer);
    }

    // For success with pending booking, auto-redirect after 15s max (even if not yet confirmed)
    const maxTimer = setTimeout(() => navigate("/dashboard"), 15000);
    return () => clearTimeout(maxTimer);
  }, [isSuccess, isFail, navigate, pendingBookingId]);

  // Once confirmed, redirect after brief delay
  useEffect(() => {
    if (bookingConfirmed) {
      const timer = setTimeout(() => navigate("/dashboard"), 2500);
      return () => clearTimeout(timer);
    }
  }, [bookingConfirmed, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-4">
        {isFail ? (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-serif font-semibold">Betalningen misslyckades</h1>
            <p className="text-muted-foreground">Något gick fel med betalningen. Du kan försöka igen.</p>
          </>
        ) : bookingConfirmed ? (
          <>
            <CheckCircle className="w-16 h-16 text-palm mx-auto" />
            <h1 className="text-2xl font-serif font-semibold">Bokningen bekräftad!</h1>
            <p className="text-muted-foreground">
              Din bokningsavgift har betalats och din resa är nu bokad. Du omdirigeras till din dashboard...
            </p>
          </>
        ) : isSuccess ? (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-serif font-semibold">Betalningen lyckades!</h1>
            <p className="text-muted-foreground">
              Vänta medan vi slutför din bokning och bokar dina flygbiljetter...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-serif font-semibold">Bearbetar...</h1>
            <p className="text-muted-foreground">Omdirigerar till din dashboard...</p>
          </>
        )}

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="mt-4"
        >
          Gå till dashboard
        </Button>
      </div>
    </div>
  );
};

export default AltapayCallback;
