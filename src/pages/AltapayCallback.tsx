import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const VALID_STATUSES = new Set(["ok", "fail", "redirect"]);

const AltapayCallback = () => {
  const { status: pathStatus } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const pathTail = location.pathname.split("/").filter(Boolean).pop() ?? null;
  const fallbackPathStatus = pathTail && VALID_STATUSES.has(pathTail) ? pathTail : null;
  const resolvedStatus = pathStatus || searchParams.get("status") || fallbackPathStatus || "redirect";
  const status = resolvedStatus.toLowerCase();

  const pendingBookingId = searchParams.get("pending_booking_id");

  const isSuccess = status === "ok";
  const isRedirect = status === "redirect";
  const isFail = status === "fail";
  const shouldPollPending = !!pendingBookingId && !isFail;

  // Poll pending_trip_bookings for status change (completed = booking finalized)
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

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
    enabled: shouldPollPending && !bookingConfirmed,
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

    // For success/redirect with pending booking, auto-redirect after 15s max (even if not yet confirmed)
    const maxTimer = setTimeout(() => navigate("/dashboard"), 15000);
    return () => clearTimeout(maxTimer);
  }, [isSuccess, isFail, navigate, pendingBookingId, t]);

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
        ) : isSuccess || isRedirect ? (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h1 className="text-2xl font-serif font-semibold">
              {isSuccess ? "Betalningen lyckades!" : "Verifierar betalning..."}
            </h1>
            <p className="text-muted-foreground">
              {isSuccess
                ? "Vänta medan vi slutför din bokning och bokar dina flygbiljetter..."
                : "Vi verifierar betalningen och slutför din bokning..."}
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
