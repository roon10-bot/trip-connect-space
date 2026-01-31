import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, CreditCard } from "lucide-react";

interface DashboardTabsProps {
  defaultTab?: string;
  bookingsContent: React.ReactNode;
  paymentsContent: React.ReactNode;
}

export const DashboardTabs = ({
  defaultTab = "bookings",
  bookingsContent,
  paymentsContent,
}: DashboardTabsProps) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
        <TabsTrigger value="bookings" className="flex items-center gap-2">
          <Plane className="w-4 h-4" />
          Mina resor
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Betalningar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="bookings">{bookingsContent}</TabsContent>
      <TabsContent value="payments">{paymentsContent}</TabsContent>
    </Tabs>
  );
};
