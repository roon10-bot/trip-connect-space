import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentHistoryProps {
  userId: string;
}

export const PaymentHistory = ({ userId }: PaymentHistoryProps) => {
  const { data: payments } = useQuery({
    queryKey: ["payments-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: tripBookings } = useQuery({
    queryKey: ["trip-bookings-history", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select("id, trips(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

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

  if (!payments || payments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ocean" />
              Betalningshistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-6">
              Inga betalningar ännu
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-ocean" />
            Betalningshistorik
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                        {(booking?.trips as any)?.name || "Okänd resa"}
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
        </CardContent>
      </Card>
    </motion.div>
  );
};
