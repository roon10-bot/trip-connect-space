import { useMemo } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Calendar, MapPin, CreditCard, CheckCircle, Wallet } from "lucide-react";
import { calculatePaymentAmount, type PaymentValueType } from "@/lib/paymentCalculations";

interface DashboardSummaryCardsProps {
  userId: string;
  tripBookings: any[] | undefined;
  onPayClick?: (booking: any) => void;
}

const formatTripType = (type: string) => {
  const types: Record<string, string> = {
    seglingsvecka: "Seglingsvecka",
    splitveckan: "Splitveckan",
    studentveckan: "Studentveckan",
  };
  return types[type] || type;
};

export const DashboardSummaryCards = ({
  userId,
  tripBookings,
  onPayClick,
}: DashboardSummaryCardsProps) => {
  // Fetch completed payments
  const { data: payments } = useQuery({
    queryKey: ["dashboard-summary-payments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("trip_booking_id, payment_type, status, amount")
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Find the most relevant booking (next upcoming or most recent)
  const activeBooking = useMemo(() => {
    if (!tripBookings || tripBookings.length === 0) return null;
    // Prefer bookings with upcoming departure
    const now = new Date();
    const upcoming = tripBookings
      .filter((b) => b.trips?.departure_date && new Date(b.trips.departure_date) > now)
      .sort((a, b) => new Date(a.trips.departure_date).getTime() - new Date(b.trips.departure_date).getTime());
    return upcoming[0] || tripBookings[0];
  }, [tripBookings]);

  // Calculate next payment for active booking
  const nextPayment = useMemo(() => {
    if (!activeBooking?.trips || !payments) return null;

    const trip = activeBooking.trips;
    const isBooker = activeBooking.user_id === userId;
    const travelers = activeBooking.travelers || 1;
    const totalPrice = isBooker
      ? Number(activeBooking.total_price)
      : Math.ceil(Number(activeBooking.total_price) / travelers);

    const paidTypes = new Set(
      payments
        .filter((p) => p.trip_booking_id === activeBooking.id)
        .map((p) => p.payment_type)
    );

    const plan = [
      {
        type: "first_payment",
        amount: trip.first_payment_amount || 0,
        payType: (trip.first_payment_type || "amount") as PaymentValueType,
        date: trip.first_payment_date,
      },
      {
        type: "second_payment",
        amount: trip.second_payment_amount || 0,
        payType: (trip.second_payment_type || "amount") as PaymentValueType,
        date: trip.second_payment_date,
      },
      {
        type: "final_payment",
        amount: trip.final_payment_amount || 0,
        payType: (trip.final_payment_type || "amount") as PaymentValueType,
        date: trip.final_payment_date,
      },
    ];

    for (const p of plan) {
      if (p.amount > 0 && !paidTypes.has(p.type)) {
        return {
          amount: calculatePaymentAmount(p.amount, p.payType, totalPrice),
          dueDate: p.date || null,
        };
      }
    }
    return null;
  }, [activeBooking, payments, userId]);

  // Calculate total paid for active booking
  const totalPaid = useMemo(() => {
    if (!payments || !activeBooking) return 0;
    return payments
      .filter((p) => p.trip_booking_id === activeBooking.id)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments, activeBooking]);

  const totalPrice = activeBooking ? Number(activeBooking.total_price) : 0;
  const paidPercent = totalPrice > 0 ? Math.min(Math.round((totalPaid / totalPrice) * 100), 100) : 0;

  const isOverdue = nextPayment?.dueDate ? new Date(nextPayment.dueDate) < new Date() : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6 mb-12"
    >
      {/* Full-width trip info card */}
      <Card className="bg-gradient-card shadow-elegant">
        <CardContent className="pt-6">
          {activeBooking?.trips ? (
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-ocean-light">
                <Plane className="w-6 h-6 text-ocean" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground">
                  {activeBooking.trips.name} – {formatTripType(activeBooking.trips.trip_type)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {format(new Date(activeBooking.trips.departure_date), "d MMMM", { locale: sv })}
                  {" – "}
                  {format(new Date(activeBooking.trips.return_date), "d MMMM yyyy", { locale: sv })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {activeBooking.departure_location}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-ocean-light">
                <Plane className="w-6 h-6 text-ocean" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Ingen resa</p>
                <p className="text-muted-foreground">Boka din första resa!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment cards row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Next payment */}
        <Card className={`bg-gradient-card shadow-elegant ${isOverdue ? "border-destructive/50" : ""}`}>
          <CardContent className="pt-6">
            {nextPayment ? (
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isOverdue ? "bg-destructive/10" : "bg-sunset-light"}`}>
                  <CreditCard className={`w-6 h-6 ${isOverdue ? "text-destructive" : "text-sunset"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">
                    {nextPayment.amount.toLocaleString("sv-SE")} kr
                  </p>
                  <p className={`text-sm ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {isOverdue
                      ? "Förfallen"
                      : nextPayment.dueDate
                      ? `Förfaller ${format(new Date(nextPayment.dueDate), "d MMMM yyyy", { locale: sv })}`
                      : "Att betala"}
                  </p>
                  {activeBooking && onPayClick && (
                    <Button
                      size="sm"
                      className="mt-2 bg-gradient-ocean hover:opacity-90"
                      onClick={() => onPayClick(activeBooking)}
                    >
                      Betala nu
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-palm-light">
                  <CheckCircle className="w-6 h-6 text-palm" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-palm">Allt betalt</p>
                  <p className="text-muted-foreground">Inga kommande betalningar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment progress */}
        <Card className="bg-gradient-card shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-palm-light">
                <Wallet className="w-6 h-6 text-palm" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Betalningsförlopp</p>
                <p className="text-xs text-muted-foreground">
                  {totalPaid.toLocaleString("sv-SE")} kr av {totalPrice.toLocaleString("sv-SE")} kr
                </p>
              </div>
              <span className="text-lg font-bold text-foreground">{paidPercent}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-ocean"
                initial={{ width: 0 }}
                animate={{ width: `${paidPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
