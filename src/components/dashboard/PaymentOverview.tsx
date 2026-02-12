import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import { calculatePaymentAmount, type PaymentValueType } from "@/lib/paymentCalculations";

interface PaymentOverviewProps {
  userId: string;
}

interface TripBookingWithTrip {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  trips: {
    name: string;
    first_payment_amount: number;
    first_payment_type: PaymentValueType;
    first_payment_date: string | null;
    second_payment_amount: number;
    second_payment_type: PaymentValueType;
    second_payment_date: string | null;
    final_payment_amount: number;
    final_payment_type: PaymentValueType;
    final_payment_date: string | null;
  } | null;
}

interface Payment {
  id: string;
  trip_booking_id: string;
  amount: number;
  payment_type: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export const PaymentOverview = ({ userId }: PaymentOverviewProps) => {
  // Fetch all trip bookings - RLS handles access for both bookers and travelers
  const { data: tripBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["trip-bookings-payment-overview", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          total_price,
          travelers,
          user_id,
          status,
          created_at,
          trips (
            name,
            first_payment_amount,
            first_payment_type,
            first_payment_date,
            second_payment_amount,
            second_payment_type,
            second_payment_date,
            final_payment_amount,
            final_payment_type,
            final_payment_date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (TripBookingWithTrip & { travelers: number; user_id: string })[];
    },
    enabled: !!userId,
  });

  // Fetch all payments - RLS handles access
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments-overview", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!userId,
  });

  // Calculate statistics
  // Helper: calculate per-person share for a booking
  const getPersonShare = (booking: TripBookingWithTrip & { travelers: number; user_id: string }) => {
    const totalPrice = Number(booking.total_price);
    const travelers = booking.travelers || 1;
    // If user is the booker, show full amount; if traveler, show per-person share
    return booking.user_id === userId ? totalPrice : totalPrice / travelers;
  };

  const stats = useMemo(() => {
    if (!tripBookings || !payments) {
      return {
        totalOwed: 0,
        totalPaid: 0,
        remaining: 0,
        percentPaid: 0,
        completedPayments: 0,
        pendingPayments: 0,
      };
    }

    const totalOwed = tripBookings.reduce(
      (sum, b) => sum + getPersonShare(b),
      0
    );

    const completedPayments = payments.filter((p) => p.status === "completed");
    const totalPaid = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const remaining = totalOwed - totalPaid;
    const percentPaid = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;

    return {
      totalOwed,
      totalPaid,
      remaining,
      percentPaid,
      completedPayments: completedPayments.length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
    };
  }, [tripBookings, payments, userId]);

  // Group payments by booking
  const paymentsByBooking = useMemo(() => {
    if (!tripBookings || !payments) return {};
    
    const grouped: Record<string, { booking: TripBookingWithTrip; payments: Payment[] }> = {};
    
    tripBookings.forEach((booking) => {
      grouped[booking.id] = {
        booking,
        payments: payments.filter((p) => p.trip_booking_id === booking.id),
      };
    });
    
    return grouped;
  }, [tripBookings, payments]);

  // Get upcoming payments (payment plan dates that haven't been paid)
  const upcomingPayments = useMemo(() => {
    if (!tripBookings || !payments) return [];
    
    const upcoming: Array<{
      bookingId: string;
      tripName: string;
      paymentType: string;
      amount: number;
      dueDate: string;
    }> = [];
    
    tripBookings.forEach((booking) => {
      if (!booking.trips) return;
      
      const totalPrice = getPersonShare(booking);
      const bookingPayments = payments.filter(
        (p) => p.trip_booking_id === booking.id && p.status === "completed"
      );
      const paidTypes = new Set(bookingPayments.map((p) => p.payment_type));
      
      const paymentPlan = [
        {
          type: "first_payment",
          label: booking.trips.first_payment_type === "percent" 
            ? `Delbetalning 1 (${booking.trips.first_payment_amount}%)`
            : "Delbetalning 1",
          amount: calculatePaymentAmount(
            booking.trips.first_payment_amount,
            booking.trips.first_payment_type || "amount",
            totalPrice
          ),
          date: booking.trips.first_payment_date,
        },
        {
          type: "second_payment",
          label: booking.trips.second_payment_type === "percent"
            ? `Delbetalning 2 (${booking.trips.second_payment_amount}%)`
            : "Delbetalning 2",
          amount: calculatePaymentAmount(
            booking.trips.second_payment_amount,
            booking.trips.second_payment_type || "amount",
            totalPrice
          ),
          date: booking.trips.second_payment_date,
        },
        {
          type: "final_payment",
          label: booking.trips.final_payment_type === "percent"
            ? `Slutbetalning (${booking.trips.final_payment_amount}%)`
            : "Slutbetalning",
          amount: calculatePaymentAmount(
            booking.trips.final_payment_amount,
            booking.trips.final_payment_type || "amount",
            totalPrice
          ),
          date: booking.trips.final_payment_date,
        },
      ];
      
      paymentPlan.forEach((pp) => {
        if (pp.amount > 0 && pp.date && !paidTypes.has(pp.type)) {
          upcoming.push({
            bookingId: booking.id,
            tripName: booking.trips?.name || "Okänd resa",
            paymentType: pp.label,
            amount: pp.amount,
            dueDate: pp.date,
          });
        }
      });
    });
    
    return upcoming.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [tripBookings, payments]);

  const isLoading = bookingsLoading || paymentsLoading;

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      first_payment: "Delbetalning 1",
      second_payment: "Delbetalning 2",
      final_payment: "Slutbetalning",
      full_payment: "Fullständig betalning",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-palm text-palm-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Betald
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Väntar
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Misslyckad
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-palm-light">
                  <CheckCircle className="w-6 h-6 text-palm" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalPaid.toLocaleString("sv-SE")} kr
                  </p>
                  <p className="text-muted-foreground">Totalt betalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-sunset-light">
                  <Wallet className="w-6 h-6 text-sunset" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.remaining.toLocaleString("sv-SE")} kr
                  </p>
                  <p className="text-muted-foreground">Kvar att betala</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-ocean-light">
                  <TrendingUp className="w-6 h-6 text-ocean" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-foreground">
                      {Math.round(stats.percentPaid)}%
                    </p>
                    <span className="text-sm text-muted-foreground">betalt</span>
                  </div>
                  <Progress value={stats.percentPaid} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-sunset" />
                Kommande betalningar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingPayments.slice(0, 5).map((payment, index) => {
                  const dueDate = new Date(payment.dueDate);
                  const isOverdue = dueDate < new Date();
                  const isDueSoon =
                    !isOverdue &&
                    dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                  return (
                    <div
                      key={`${payment.bookingId}-${payment.paymentType}-${index}`}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isOverdue
                          ? "border-destructive/50 bg-destructive/5"
                          : isDueSoon
                          ? "border-sunset/50 bg-sunset/5"
                          : "border-border"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{payment.tripName}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.paymentType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {payment.amount.toLocaleString("sv-SE")} kr
                        </p>
                        <p
                          className={`text-sm ${
                            isOverdue
                              ? "text-destructive font-medium"
                              : isDueSoon
                              ? "text-sunset font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isOverdue
                            ? "Förfallen"
                            : format(dueDate, "d MMM yyyy", { locale: sv })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ocean" />
              Betalningshistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const booking = tripBookings?.find(
                    (b) => b.id === payment.trip_booking_id
                  );
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${
                            payment.status === "completed"
                              ? "bg-palm-light"
                              : "bg-muted"
                          }`}
                        >
                          <CreditCard
                            className={`w-4 h-4 ${
                              payment.status === "completed"
                                ? "text-palm"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {booking?.trips?.name || "Okänd resa"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getPaymentTypeLabel(payment.payment_type)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold">
                            {Number(payment.amount).toLocaleString("sv-SE")} kr
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.paid_at
                              ? format(new Date(payment.paid_at), "d MMM yyyy", {
                                  locale: sv,
                                })
                              : format(new Date(payment.created_at), "d MMM yyyy", {
                                  locale: sv,
                                })}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 p-4 rounded-full bg-muted w-fit">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Ingen betalningshistorik ännu
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
