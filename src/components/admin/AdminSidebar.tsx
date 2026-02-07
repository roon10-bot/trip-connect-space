import { Map, PlusCircle, Ticket, LayoutDashboard, ClipboardList, CreditCard, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminView = "dashboard" | "trips" | "create-trip" | "discount-codes" | "bookings" | "transactions" | "customers" | "meeting-slots";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

const menuItems = [
  {
    label: "Dashboard",
    value: "dashboard" as AdminView,
    icon: LayoutDashboard,
  },
  {
    label: "Reseadministration",
    items: [
      {
        label: "Mina resor",
        value: "trips" as AdminView,
        icon: Map,
      },
      {
        label: "Skapa en resa",
        value: "create-trip" as AdminView,
        icon: PlusCircle,
      },
      {
        label: "Bokningar",
        value: "bookings" as AdminView,
        icon: ClipboardList,
      },
      {
        label: "Transaktioner",
        value: "transactions" as AdminView,
        icon: CreditCard,
      },
      {
        label: "Rabattkoder",
        value: "discount-codes" as AdminView,
        icon: Ticket,
      },
      {
        label: "Kunder",
        value: "customers" as AdminView,
        icon: Users,
      },
      {
        label: "Mötesbokning",
        value: "meeting-slots" as AdminView,
        icon: Video,
      },
    ],
  },
];

export const AdminSidebar = ({ currentView, onViewChange }: AdminSidebarProps) => {
  return (
    <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-112px)] p-4">
      <nav className="space-y-6">
        {menuItems.map((section, idx) => (
          <div key={idx}>
            {"items" in section ? (
              <>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {section.label}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => onViewChange(item.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        currentView === item.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                onClick={() => onViewChange(section.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentView === section.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
