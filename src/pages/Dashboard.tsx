import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingDetailsDialog } from "@/components/BookingDetailsDialog";
import { TripBookingDetailsDialog } from "@/components/TripBookingDetailsDialog";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { PaymentOverview } from "@/components/dashboard/PaymentOverview";
import { BookingsList } from "@/components/dashboard/BookingsList";
import { toast } from "sonner";
import {
  Plane,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

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
            price,
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

        {/* Dashboard Tabs */}
        <DashboardTabs
          bookingsContent={
            <BookingsList
              tripBookings={tripBookings}
              tripBookingsLoading={tripBookingsLoading}
              destinationBookings={bookings}
              onTripBookingClick={(booking) => {
                setSelectedTripBooking(booking);
                setTripDetailsOpen(true);
              }}
              onDestinationBookingClick={(booking) => {
                setSelectedBooking(booking);
                setDetailsOpen(true);
              }}
            />
          }
          paymentsContent={
            user?.id ? (
              <PaymentOverview userId={user.id} />
            ) : null
          }
        />
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
