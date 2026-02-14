import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingDetailsDialog } from "@/components/BookingDetailsDialog";
import { TripBookingDetailsDialog } from "@/components/TripBookingDetailsDialog";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardSummaryCards } from "@/components/dashboard/DashboardSummaryCards";
import { PaymentOverview } from "@/components/dashboard/PaymentOverview";
import { BookingsList } from "@/components/dashboard/BookingsList";
import { toast } from "sonner";

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

        {/* Summary Cards */}
        {user?.id && (
          <DashboardSummaryCards
            userId={user.id}
            tripBookings={tripBookings}
            onPayClick={(booking) => {
              setSelectedTripBooking(booking);
              setTripDetailsOpen(true);
            }}
          />
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
