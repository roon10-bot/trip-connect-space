import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Plane,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export const TripBookingsList = () => {
  const queryClient = useQueryClient();

  const { data: tripBookings, isLoading } = useQuery({
    queryKey: ["admin-trip-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trips (
            name,
            trip_type,
            departure_date,
            return_date
          )
        `)
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

      // Send email on confirmed or cancelled
      if (status === "confirmed" || status === "cancelled") {
        const booking = tripBookings?.find(b => b.id === bookingId);
        if (booking) {
          const templateKey = status === "confirmed" ? "booking_confirmation" : "booking_cancelled";
          const trip = booking.trips as { name: string; departure_date: string; return_date: string } | null;
          
          try {
            await supabase.functions.invoke("send-transactional-email", {
              body: {
                template_key: templateKey,
                to_email: booking.email,
                variables: {
                  first_name: booking.first_name,
                  trip_name: trip?.name || "",
                  departure_date: trip?.departure_date || "",
                  return_date: trip?.return_date || "",
                  travelers: String(booking.travelers),
                  total_price: String(booking.total_price),
                },
                action_url: status === "confirmed" 
                  ? `${window.location.origin}/dashboard`
                  : `${window.location.origin}/contact`,
              },
            });
          } catch (emailErr) {
            console.error("Failed to send status email:", emailErr);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings"] });
      toast.success("Bokning borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort bokningen");
    },
  });

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Resebokningar</CardTitle>
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
        <CardTitle className="font-serif">Resebokningar</CardTitle>
        <CardDescription>
          Hantera bokningar för resor (Seglingsvecka, Splitveckan, Studentveckan)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tripBookings && tripBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kund</TableHead>
                  <TableHead>Resa</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Resenärer</TableHead>
                  <TableHead>Pris</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tripBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {booking.first_name} {booking.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.trips?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.trips?.trip_type && formatTripType(booking.trips.trip_type)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.trips?.departure_date && (
                        <span className="text-sm">
                          {format(new Date(booking.trips.departure_date), "d MMM", { locale: sv })} -{" "}
                          {booking.trips.return_date && format(new Date(booking.trips.return_date), "d MMM", { locale: sv })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {booking.travelers}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">
                          {Number(booking.total_price).toLocaleString("sv-SE")} kr
                        </p>
                        {booking.discount_code && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Tag className="w-3 h-3" />
                            {booking.discount_code}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
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
                          <SelectTrigger className="w-32">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga resebokningar ännu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
