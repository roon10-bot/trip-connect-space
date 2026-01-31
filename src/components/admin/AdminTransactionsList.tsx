import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export const AdminTransactionsList = () => {
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: tripBookings } = useQuery({
    queryKey: ["admin-trip-bookings-for-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          id,
          first_name,
          last_name,
          trips (
            name,
            trip_type
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  const getBookingInfo = (tripBookingId: string) => {
    return tripBookings?.find((b) => b.id === tripBookingId);
  };

  const formatPaymentType = (type: string) => {
    const types: Record<string, string> = {
      first: "Betalning 1",
      second: "Betalning 2",
      final: "Betalning 3",
      full: "Fullbetalning",
    };
    return types[type] || type;
  };

  const getPaymentNumber = (type: string): number | null => {
    const numbers: Record<string, number> = {
      first: 1,
      second: 2,
      final: 3,
    };
    return numbers[type] || null;
  };

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-palm text-palm-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Genomförd
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
            <XCircle className="w-3 h-3 mr-1" />
            Misslyckad
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (paymentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Transaktioner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Transaktioner</CardTitle>
        <CardDescription>
          Alla genomförda och väntande betalningar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Belopp</TableHead>
                  <TableHead>Restyp</TableHead>
                  <TableHead>Betalning</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const bookingInfo = getBookingInfo(payment.trip_booking_id);
                  const paymentNumber = getPaymentNumber(payment.payment_type);

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {bookingInfo
                            ? `${bookingInfo.first_name} ${bookingInfo.last_name}`
                            : "Okänd"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {Number(payment.amount).toLocaleString("sv-SE")} kr
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{bookingInfo?.trips?.name || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {bookingInfo?.trips?.trip_type &&
                              formatTripType(bookingInfo.trips.trip_type)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {paymentNumber && (
                            <Badge variant="outline" className="font-mono">
                              {paymentNumber}/3
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatPaymentType(payment.payment_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {payment.paid_at
                            ? format(new Date(payment.paid_at), "d MMM yyyy HH:mm", {
                                locale: sv,
                              })
                            : format(new Date(payment.created_at), "d MMM yyyy HH:mm", {
                                locale: sv,
                              })}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga transaktioner ännu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
