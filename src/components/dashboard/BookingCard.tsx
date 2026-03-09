import React from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

interface BookingCardProps {
  booking: {
    id: string;
    status: string;
    departure_location: string;
    trips?: {
      name: string;
      trip_type?: string;
      departure_date?: string;
      return_date?: string;
    } | null;
    [key: string]: unknown;
  };
  showStatus?: boolean;
  onClick: () => void;
}

const formatTripType = (type: string) => {
  const types: Record<string, string> = {
    seglingsvecka: "Seglingsvecka",
    splitveckan: "Splitveckan",
    studentveckan: "Studentveckan",
  };
  return types[type] || type;
};

export const BookingCard = React.memo(function BookingCard({ booking, showStatus = true, onClick }: BookingCardProps) {
  const { t } = useTranslation();

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

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
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
            <span>{t("dashboard.details")}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
