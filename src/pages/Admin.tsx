import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminSidebar, AdminView } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { TripsList } from "@/components/admin/TripsList";
import { CreateTripForm } from "@/components/admin/CreateTripForm";
import { DiscountCodesList } from "@/components/admin/DiscountCodesList";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !adminLoading && user && !isAdmin) {
      toast.error("Du har inte behörighet att se denna sida");
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const handleTripCreated = () => {
    setCurrentView("trips");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <AdminDashboard isAdmin={isAdmin} userId={user?.id} />;
      case "trips":
        return <TripsList onEditTrip={(id) => console.log("Edit trip", id)} />;
      case "create-trip":
        return <CreateTripForm onSuccess={handleTripCreated} />;
      case "discount-codes":
        return <DiscountCodesList />;
      default:
        return <AdminDashboard isAdmin={isAdmin} userId={user?.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-14 flex">
        <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
        
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-serif font-bold text-foreground">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {currentView === "dashboard" && "Översikt och statistik"}
              {currentView === "trips" && "Hantera dina resor"}
              {currentView === "create-trip" && "Skapa en ny resa"}
              {currentView === "discount-codes" && "Hantera rabattkoder"}
            </p>
          </motion.div>

          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;
