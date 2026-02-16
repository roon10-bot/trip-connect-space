import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TrendingUp,
  Ship,
  Ticket,
  Plane,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminBookingDetailDialog } from "@/components/admin/AdminBookingDetailDialog";

interface AdminDashboardProps {
  isAdmin: boolean;
  userId?: string;
}

export const AdminDashboard = ({ isAdmin, userId }: AdminDashboardProps) => {
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
    enabled: isAdmin,
  });

  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("trip_bookings")
        .update({ status })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings"] });
      toast.success("Status uppdaterad");
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
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
    onError: () => toast.error("Kunde inte ta bort bokningen"),
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const revenue30d = (tripBookings || [])
    .filter((b) => new Date(b.created_at) >= thirtyDaysAgo)
    .reduce((sum, b) => sum + Number(b.total_price), 0);

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
        return <Badge className="bg-palm text-palm-foreground"><CheckCircle className="w-3 h-3 mr-1" />Bekräftad</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Väntar</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Avbokad</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

      {/* Trip Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Resebokningar</CardTitle>
          <CardDescription>Hantera bokningar för resor (Seglingsvecka, Splitveckan, Studentveckan)</CardDescription>
        </CardHeader>
        <CardContent>
          {!tripBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : tripBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga resebokningar ännu</p>
            </div>
          ) : (
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
                          <p className="font-medium">{booking.first_name} {booking.last_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.trips?.name}</p>
                          <p className="text-sm text-ocean">{booking.trips?.trip_type && formatTripType(booking.trips.trip_type)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.trips?.departure_date && booking.trips?.return_date && (
                          <span className="text-sm">
                            {format(new Date(booking.trips.departure_date), "d MMM", { locale: sv })} – {format(new Date(booking.trips.return_date), "d MMM", { locale: sv })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          {booking.travelers}
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
                            onValueChange={(value) => updateStatusMutation.mutate({ bookingId: booking.id, status: value })}
                          >
                            <SelectTrigger className="w-[120px]">
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
                                  Denna åtgärd kan inte ångras. Bokningen för {booking.first_name} {booking.last_name} kommer att tas bort permanent.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBookingMutation.mutate(booking.id)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};
