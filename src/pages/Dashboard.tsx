import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingDetailsDialog } from "@/components/BookingDetailsDialog";
import { TripBookingDetailsDialog } from "@/components/TripBookingDetailsDialog";
import { toast } from "sonner";
import {
  Plane,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTripBooking, setSelectedTripBooking] = useState<any>(null);
  const [tripDetailsOpen, setTripDetailsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast.success("Betalningen genomfördes! Din resa är nu bekräftad.");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");
    } else if (paymentStatus === "cancelled") {
      toast.info("Betalningen avbröts. Du kan betala när du är redo.");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          destinations (
            name,
            country,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch trip bookings (resebokningar)
  const { data: tripBookings, isLoading: tripBookingsLoading } = useQuery({
    queryKey: ["trip-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("trip_bookings")
        .select(`
          *,
          trips (
            name,
            trip_type,
            departure_date,
            return_date,
            departure_location,
            price
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Välkommen, {profile?.full_name || user?.email?.split("@")[0]}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Här kan du se och hantera dina bokningar
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-ocean-light">
                  <Plane className="w-6 h-6 text-ocean" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {(bookings?.length || 0) + (tripBookings?.length || 0)}
                  </p>
                  <p className="text-muted-foreground">Totala bokningar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-sunset-light">
                  <Calendar className="w-6 h-6 text-sunset" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {(bookings?.filter((b) => b.status === "confirmed").length || 0) + 
                     (tripBookings?.filter((b) => b.status === "confirmed").length || 0)}
                  </p>
                  <p className="text-muted-foreground">Bekräftade resor</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card shadow-elegant">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-palm-light">
                  <MapPin className="w-6 h-6 text-palm" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {(new Set(bookings?.map((b) => b.destination_id)).size || 0) + 
                     (new Set(tripBookings?.map((b) => b.trip_id)).size || 0)}
                  </p>
                  <p className="text-muted-foreground">Unika resor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trip Bookings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Mina resebokningar
            </h2>
            <Link to="/search">
              <Button className="bg-gradient-ocean hover:opacity-90">
                Boka ny resa
              </Button>
            </Link>
          </div>

          {tripBookingsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <Skeleton className="w-32 h-24 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tripBookings && tripBookings.length > 0 ? (
            <div className="space-y-4">
              {tripBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedTripBooking(booking);
                      setTripDetailsOpen(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-serif font-semibold text-foreground">
                              {booking.trips?.name}
                            </h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-muted-foreground flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4" />
                            {booking.departure_location}
                          </p>
                          <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-ocean" />
                              <span>
                                {booking.trips?.departure_date && format(new Date(booking.trips.departure_date), "d MMM", { locale: sv })} -{" "}
                                {booking.trips?.return_date && format(new Date(booking.trips.return_date), "d MMM yyyy", { locale: sv })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-ocean" />
                              <span>{booking.travelers} resenär{booking.travelers > 1 ? "er" : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                            <CreditCard className="w-5 h-5 text-sunset" />
                            {Number(booking.total_price).toLocaleString("sv-SE")} kr
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Bokad {format(new Date(booking.created_at), "d MMM yyyy", { locale: sv })}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-ocean mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Visa detaljer</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-card">
              <CardHeader className="text-center py-8">
                <div className="mx-auto mb-4 p-4 rounded-full bg-ocean-light w-fit">
                  <Plane className="w-8 h-8 text-ocean" />
                </div>
                <CardTitle className="font-serif">Inga resebokningar ännu</CardTitle>
                <CardDescription className="text-lg">
                  Utforska våra fantastiska resor och boka din första resa!
                </CardDescription>
                <Link to="/search" className="mt-6 inline-block">
                  <Button size="lg" className="bg-gradient-ocean hover:opacity-90">
                    Sök resor
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          )}
        </motion.div>

        {/* Destination Bookings Section (legacy) */}
        {bookings && bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-semibold text-foreground">
                Destinationsbokningar
              </h2>
              <Link to="/destinations">
                <Button variant="outline">
                  Boka destination
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card 
                    className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setDetailsOpen(true);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-48 h-48 md:h-auto">
                          <img
                            src={booking.destinations?.image_url || ""}
                            alt={booking.destinations?.name || ""}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-serif font-semibold text-foreground">
                                  {booking.destinations?.name}
                                </h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <p className="text-muted-foreground flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4" />
                                {booking.destinations?.country}
                              </p>
                              <div className="flex flex-wrap gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-ocean" />
                                  <span>
                                    {format(new Date(booking.check_in), "d MMM", { locale: sv })} -{" "}
                                    {format(new Date(booking.check_out), "d MMM yyyy", { locale: sv })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-ocean" />
                                  <span>{booking.guests} gäster</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                                <CreditCard className="w-5 h-5 text-sunset" />
                                {Number(booking.total_price).toLocaleString("sv-SE")} kr
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Bokad {format(new Date(booking.created_at), "d MMM yyyy", { locale: sv })}
                              </p>
                              <div className="flex items-center gap-1 text-sm text-ocean mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Visa detaljer</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <Footer />

      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <TripBookingDetailsDialog
        booking={selectedTripBooking}
        open={tripDetailsOpen}
        onOpenChange={setTripDetailsOpen}
      />
    </div>
  );
};

export default Dashboard;
