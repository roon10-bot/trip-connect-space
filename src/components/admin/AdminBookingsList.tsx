import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plane,
  ChevronDown,
  ChevronUp,
  Calendar,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const AdminBookingsList = () => {
  const queryClient = useQueryClient();
  const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

  const { data: tripBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-trip-bookings-with-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trips (
            name,
            trip_type,
            departure_date,
            return_date,
            price,
            first_payment_amount,
            second_payment_amount,
            final_payment_amount
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("trip_bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings-with-payments"] });
      toast.success("Bokningsstatus uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("trip_bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings-with-payments"] });
      toast.success("Bokning borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort bokningen");
    },
  });

  const toggleExpanded = (bookingId: string) => {
    setExpandedBookings((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
      }
      return next;
    });
  };

  const getBookingPayments = (bookingId: string) => {
    return payments?.filter((p) => p.trip_booking_id === bookingId && p.status === "completed") || [];
  };

  const calculatePaymentProgress = (bookingId: string, totalPrice: number) => {
    const bookingPayments = getBookingPayments(bookingId);
    const paidAmount = bookingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const percentage = totalPrice > 0 ? Math.round((paidAmount / totalPrice) * 100) : 0;
    return { paidAmount, percentage };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-palm text-palm-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Bekräftad
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Väntar
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Avbokad
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatBookingNumber = (id: string) => {
    return id.slice(0, 8).toUpperCase();
  };

  if (bookingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Bokningar</CardTitle>
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
        <CardTitle className="font-serif">Bokningar</CardTitle>
        <CardDescription>
          Alla resebokningar med betalningsstatus och detaljer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tripBookings && tripBookings.length > 0 ? (
          <div className="space-y-2">
            {tripBookings.map((booking) => {
              const isExpanded = expandedBookings.has(booking.id);
              const { paidAmount, percentage } = calculatePaymentProgress(
                booking.id,
                Number(booking.total_price)
              );

              return (
                <Collapsible
                  key={booking.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(booking.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {booking.first_name} {booking.last_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {booking.trips?.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">
                                {Number(booking.total_price).toLocaleString("sv-SE")} kr
                              </p>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage} className="w-24 h-2" />
                                <span className="text-xs text-muted-foreground">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4 bg-muted/30">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Bokningsnummer</p>
                              <p className="font-mono text-sm">{formatBookingNumber(booking.id)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Antal passagerare</p>
                              <p className="text-sm font-medium">{booking.travelers} st</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Bokningsdatum</p>
                              <p className="text-sm">
                                {format(new Date(booking.created_at), "d MMM yyyy", { locale: sv })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Avresedatum</p>
                              <p className="text-sm">
                                {booking.trips?.departure_date &&
                                  format(new Date(booking.trips.departure_date), "d MMM yyyy", {
                                    locale: sv,
                                  })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-background rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium mb-3">Betalningsstatus</h4>
                          <div className="flex items-center gap-4 mb-2">
                            <Progress value={percentage} className="flex-1 h-3" />
                            <span className="text-sm font-medium">{percentage}% betalt</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>
                              Betalt: {paidAmount.toLocaleString("sv-SE")} kr
                            </span>
                            <span>
                              Kvar: {(Number(booking.total_price) - paidAmount).toLocaleString("sv-SE")} kr
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Select
                            value={booking.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                bookingId: booking.id,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Väntar</SelectItem>
                              <SelectItem value="confirmed">Bekräftad</SelectItem>
                              <SelectItem value="cancelled">Avbokad</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort bokning?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill ta bort denna bokning? Denna åtgärd
                                  kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBookingMutation.mutate(booking.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga bokningar ännu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
