import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminSidebar, AdminView } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { TripsList } from "@/components/admin/TripsList";
import { CreateTripForm } from "@/components/admin/CreateTripForm";
import { DiscountCodesList } from "@/components/admin/DiscountCodesList";
import { AdminBookingsList } from "@/components/admin/AdminBookingsList";
import { AdminTransactionsList } from "@/components/admin/AdminTransactionsList";
import { AdminCustomersList } from "@/components/admin/AdminCustomersList";
import { AdminAccountsList } from "@/components/admin/AdminAccountsList";
import { AdminMeetingSlots } from "@/components/admin/AdminMeetingSlots";
import { AdminEmailTemplates } from "@/components/admin/AdminEmailTemplates";
import { TripBookingDocuments } from "@/components/admin/TripBookingDocuments";
import { TripTemplatesList } from "@/components/admin/TripTemplatesList";
import { AdminPartnersList } from "@/components/admin/AdminPartnersList";
import { AdminListingsList } from "@/components/admin/AdminListingsList";
import { AdminSalesReport } from "@/components/admin/AdminSalesReport";
import { AdminTestChecklist } from "@/components/admin/AdminTestChecklist";
import { AdminSwishSettings } from "@/components/admin/AdminSwishSettings";
import { Shield, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import studentresorLogo from "@/assets/studentresor-logo.svg";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const getInitialView = (): AdminView => {
    const hash = window.location.hash.replace("#", "");
    const validViews: AdminView[] = ["dashboard", "trips", "create-trip", "discount-codes", "bookings", "transactions", "customers", "meeting-slots", "accounts", "email-templates", "documents", "trip-templates", "partners", "partner-listings", "sales-report", "test-checklist", "settings"];
    return validViews.includes(hash as AdminView) ? (hash as AdminView) : "dashboard";
  };
  const [currentView, setCurrentView] = useState<AdminView>(getInitialView);

  const handleViewChange = (view: AdminView) => {
    setCurrentView(view);
    window.location.hash = view;
  };

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
    handleViewChange("trips");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
      case "bookings":
        return <AdminBookingsList />;
      case "transactions":
        return <AdminTransactionsList />;
      case "discount-codes":
        return <DiscountCodesList />;
      case "customers":
        return <AdminCustomersList />;
      case "accounts":
        return <AdminAccountsList />;
      case "meeting-slots":
        return <AdminMeetingSlots />;
      case "email-templates":
        return <AdminEmailTemplates />;
      case "documents":
        return <TripBookingDocuments />;
      case "trip-templates":
        return <TripTemplatesList />;
      case "partners":
        return <AdminPartnersList />;
      case "partner-listings":
        return <AdminListingsList />;
      case "sales-report":
        return <AdminSalesReport />;
      case "test-checklist":
        return <AdminTestChecklist />;
      case "settings":
        return <AdminSwishSettings />;
      default:
        return <AdminDashboard isAdmin={isAdmin} userId={user?.id} />;
    }
  };

  const viewDescriptions: Record<AdminView, string> = {
    dashboard: "Översikt och statistik",
    trips: "Hantera dina resor",
    "create-trip": "Skapa en ny resa",
    bookings: "Alla resebokningar",
    transactions: "Betalningshistorik",
    "discount-codes": "Hantera rabattkoder",
    customers: "Alla kunder som bokat resa",
    accounts: "Hantera registrerade konton",
    "meeting-slots": "Hantera tider för videosamtal",
    "email-templates": "Redigera e-postmallar",
    documents: "Ladda upp flygbiljetter och dokument till kunder",
    "trip-templates": "Skapa och hantera resmallar",
    partners: "Hantera värdansökningar",
    "partner-listings": "Godkänn boenden från värdar",
    "sales-report": "Generera och exportera försäljningsrapporter",
    "test-checklist": "Bocka av testfall innan produktionslansering",
    "settings": "Swish-miljö och systeminställningar",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Admin Top Bar */}
      <header className="h-14 bg-ocean text-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <img src={studentresorLogo} alt="Studentresor" className="h-7 brightness-0 invert" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white/50 ml-2">Control Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => window.open("/", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visa sajten
          </Button>
          <span className="text-sm text-white/50">{user?.email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar currentView={currentView} onViewChange={handleViewChange} />
        
        <main className="flex-1 min-w-0 p-10 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-serif font-bold text-foreground">
                Studentresor Control Center
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {viewDescriptions[currentView]}
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
    </div>
  );
};

export default Admin;
