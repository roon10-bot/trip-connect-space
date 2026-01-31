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
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

  const stats = {
    totalBookings: bookings?.length || 0,
    confirmedBookings: bookings?.filter((b) => b.status === "confirmed").length || 0,
    pendingBookings: bookings?.filter((b) => b.status === "pending").length || 0,
    totalRevenue: bookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0,
    activeTrips: trips?.filter((t) => t.is_active).length || 0,
    totalTrips: trips?.length || 0,
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-ocean-light">
                <Plane className="w-6 h-6 text-ocean" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.totalBookings}</p>
                <p className="text-muted-foreground">Totala bokningar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-palm-light">
                <CheckCircle className="w-6 h-6 text-palm" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{stats.confirmedBookings}</p>
                <p className="text-muted-foreground">Bekräftade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-sunset-light">
                <Ship className="w-6 h-6 text-sunset" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.activeTrips}/{stats.totalTrips}
                </p>
                <p className="text-muted-foreground">Aktiva resor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-elegant">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-ocean-light">
                <TrendingUp className="w-6 h-6 text-ocean" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalRevenue.toLocaleString("sv-SE")} kr
                </p>
                <p className="text-muted-foreground">Total omsättning</p>
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
    </div>
  );
};
