import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

interface Props {
  partnerId: string;
}

export const PartnerBookings = ({ partnerId }: Props) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">{t("partner.bookings.title")}</h2>
        <p className="text-muted-foreground">{t("partner.bookings.subtitle")}</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("partner.bookings.noBookings")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("partner.bookings.noBookingsDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
};