import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingDetailsDialog } from "@/components/BookingDetailsDialog";
import { TripBookingDetailsDialog } from "@/components/TripBookingDetailsDialog";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { PaymentHistory } from "@/components/dashboard/PaymentHistory";
import { MyDocuments } from "@/components/dashboard/MyDocuments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle, XCircle, Clock, ChevronRight, History } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { t } = useTranslation();
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

  // Fetch trip bookings (resebokningar) - RLS handles access for both bookers and travelers
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Split bookings into active, past, and cancelled
  const { activeBookings, pastBookings, cancelledBookings } = useMemo(() => {
    if (!tripBookings) return { activeBookings: [], pastBookings: [], cancelledBookings: [] };
    const now = new Date();
    const active: typeof tripBookings = [];
    const past: typeof tripBookings = [];
    const cancelled: typeof tripBookings = [];

    for (const b of tripBookings) {
      if (b.status === "cancelled") {
        cancelled.push(b);
      } else if (b.trips?.return_date && new Date(b.trips.return_date) < now) {
        past.push(b);
      } else {
        active.push(b);
      }
    }
    return { activeBookings: active, pastBookings: past, cancelledBookings: cancelled };
  }, [tripBookings]);

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
            {t("dashboard.confirmed")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {t("dashboard.pending")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {t("dashboard.cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderBookingCard = (booking: any, showStatus = true) => (
    <Card
      key={booking.id}
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => {
        setSelectedTripBooking(booking);
        setTripDetailsOpen(true);
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-lg font-serif font-semibold text-foreground">
                {booking.trips?.name}
              </h3>
              {showStatus && getStatusBadge(booking.status)}
            </div>
            {booking.trips?.trip_type && (
              <p className="text-sm text-muted-foreground mb-2">
                {formatTripType(booking.trips.trip_type)}
              </p>
            )}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-ocean" />
                <span>
                  {booking.trips?.departure_date &&
                    format(new Date(booking.trips.departure_date), "d MMMM", { locale: sv })}{" "}
                  –{" "}
                  {booking.trips?.return_date &&
                    format(new Date(booking.trips.return_date), "d MMMM yyyy", { locale: sv })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ocean" />
                <span>{booking.departure_location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-ocean opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <span>Detaljer</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

        {/* Summary Cards - shows active bookings */}
        {user?.id && (
          <DashboardSummaryCards
            userId={user.id}
            tripBookings={activeBookings}
            onPayClick={(booking) => {
              setSelectedTripBooking(booking);
              setTripDetailsOpen(true);
            }}
          />
        )}

        {/* Payment History & Documents */}
        {user?.id && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <PaymentHistory userId={user.id} />
            <MyDocuments userId={user.id} />
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-serif font-semibold text-foreground">
                Genomförda resor
              </h2>
            </div>
            <div className="space-y-3">
              {pastBookings.map((booking) => renderBookingCard(booking))}
            </div>
          </motion.div>
        )}

        {/* Cancelled Bookings */}
        {cancelledBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-serif font-semibold text-foreground">
                Avbokade resor
              </h2>
            </div>
            <div className="space-y-3">
              {cancelledBookings.map((booking) => renderBookingCard(booking, false))}
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
