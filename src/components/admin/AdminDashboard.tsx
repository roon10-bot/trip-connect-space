import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Button } from "@/components/ui/button";
import {
  Plane,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  TrendingUp,
  Ship,
  Ticket,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TripBookingsList } from "./TripBookingsList";

interface AdminDashboardProps {
  isAdmin: boolean;
  userId?: string;
}

export const AdminDashboard = ({ isAdmin, userId }: AdminDashboardProps) => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          destinations (
            name,
            country
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: trips } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("departure_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: tripBookings } = useQuery({
    queryKey: ["admin-trip-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: completedPayments } = useQuery({
    queryKey: ["admin-completed-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, paid_at")
        .eq("status", "completed");

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Bokningsstatus uppdaterad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera status");
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Bokning borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort bokningen");
    },
  });

  const getProfileName = (profileUserId: string) => {
    const profile = profiles?.find((p) => p.user_id === profileUserId);
    return profile?.full_name || "Okänd användare";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preliminary":
        return (
          <Badge className="bg-amber-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Preliminärt bokad
          </Badge>
        );
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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const revenue30d = (completedPayments || [])
    .filter((p) => p.paid_at && new Date(p.paid_at) >= thirtyDaysAgo)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const bookingsThisWeek = (tripBookings || []).filter(
    (b) => new Date(b.created_at) >= startOfWeek
  ).length;

  const totalTravelers = (tripBookings || []).reduce((sum, b) => sum + (b.travelers || 1), 0);

  const avgFillRate = trips && trips.length > 0
    ? Math.round(
        (trips.reduce((sum, t) => {
          const booked = (tripBookings || []).filter((b) => b.trip_id === t.id).reduce((s, b) => s + (b.travelers || 1), 0);
          return sum + (booked / t.capacity) * 100;
        }, 0) / trips.length)
      )
    : 0;

  return (
    <div className="space-y-10">
      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <TrendingUp className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {revenue30d.toLocaleString("sv-SE")} kr
                </p>
                <p className="text-white/60 mt-1">Omsättning (30 dagar)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Ticket className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{bookingsThisWeek}</p>
                <p className="text-white/60 mt-1">Bokningar (denna vecka)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Users className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalTravelers}</p>
                <p className="text-white/60 mt-1">Antal resenärer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Ship className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{avgFillRate}%</p>
                <p className="text-white/60 mt-1">Fyllnadsgrad per resa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Senaste bokningar</CardTitle>
          <CardDescription>
            Hantera och uppdatera bokningsstatus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kund</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Gäster</TableHead>
                    <TableHead>Pris</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.slice(0, 10).map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {getProfileName(booking.user_id)}
                      </TableCell>
                      <TableCell>
                        {booking.destinations?.name}, {booking.destinations?.country}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.check_in), "d MMM", { locale: sv })} -{" "}
                        {format(new Date(booking.check_out), "d MMM", { locale: sv })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {booking.guests}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(booking.total_price).toLocaleString("sv-SE")} kr
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
                              <SelectItem value="preliminary">Preliminärt bokad</SelectItem>
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
              <p className="text-muted-foreground">Inga bokningar ännu</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Bookings */}
      <TripBookingsList />
    </div>
  );
};
