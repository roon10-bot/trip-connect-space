import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Home, CalendarDays, ClipboardList, Wallet, LogOut, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerListings } from "@/components/partner/PartnerListings";
import { PartnerAvailability } from "@/components/partner/PartnerAvailability";
import { PartnerBookings } from "@/components/partner/PartnerBookings";
import { PartnerPayouts } from "@/components/partner/PartnerPayouts";
import { CreateListingWizard } from "@/components/partner/CreateListingWizard";
import studentresorLogo from "@/assets/studentresor-logo.svg";

type PartnerView = "listings" | "availability" | "bookings" | "payouts";

const Partner = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { partnerProfile, isApproved, isPending, isRejected, isLoading } = usePartner();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<PartnerView>("listings");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // No partner profile at all → redirect
  if (!partnerProfile) {
    navigate("/auth?mode=signup&tab=host");
    return null;
  }

  // Pending state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Väntar på godkännande</h1>
          <p className="text-muted-foreground">
            Ditt värdkonto granskas. Vi meddelar dig via e-post så snart det har godkänts.
          </p>
          <Button variant="outline" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" /> Logga ut
          </Button>
        </motion.div>
      </div>
    );
  }

  // Rejected state
  if (isRejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Ansökan nekad</h1>
          <p className="text-muted-foreground">
            Tyvärr har din ansökan nekats. Kontakta oss om du har frågor.
          </p>
          <Button variant="outline" onClick={() => navigate("/kontakt")}>Kontakta oss</Button>
        </motion.div>
      </div>
    );
  }

  if (!isApproved) return null;

  const menuItems = [
    { label: "Mina boenden", value: "listings" as PartnerView, icon: Home },
    { label: "Tillgänglighet & Priser", value: "availability" as PartnerView, icon: CalendarDays },
    { label: "Bokningar", value: "bookings" as PartnerView, icon: ClipboardList },
    { label: "Utbetalningar", value: "payouts" as PartnerView, icon: Wallet },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderContent = () => {
    switch (currentView) {
      case "listings":
        return <PartnerListings partnerId={partnerProfile.id} />;
      case "availability":
        return <PartnerAvailability partnerId={partnerProfile.id} />;
      case "bookings":
        return <PartnerBookings partnerId={partnerProfile.id} />;
      case "payouts":
        return <PartnerPayouts partnerId={partnerProfile.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 bg-ocean text-white flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <img src={studentresorLogo} alt="Studentresor" className="h-7 brightness-0 invert" />
          <span className="text-xs font-semibold tracking-wider uppercase text-white/50 ml-2">Värdportal</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => window.open("/", "_blank")}>
            <ExternalLink className="w-4 h-4 mr-2" /> Visa sajten
          </Button>
          <span className="text-sm text-white/50">{user?.email}</span>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" /> Logga ut
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 bg-ocean text-white min-h-0 p-6 overflow-auto">
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.value}
                onClick={() => setCurrentView(item.value)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === item.value
                    ? "bg-cyan text-ocean"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-10 overflow-auto">
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

export default Partner;
