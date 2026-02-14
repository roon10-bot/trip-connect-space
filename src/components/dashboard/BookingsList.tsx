import { useMemo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { calculatePaymentAmount, type PaymentValueType } from "@/lib/paymentCalculations";

interface TripBooking {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  departure_location: string;
  travelers: number;
  total_price: number;
  discount_code: string | null;
  discount_amount: number | null;
  status: string;
  created_at: string;
  user_id?: string | null;
  trips: {
    name: string;
    trip_type: string;
    departure_date: string;
    return_date: string;
    departure_location: string;
    price: number;
    first_payment_amount?: number;
    first_payment_type?: PaymentValueType;
    first_payment_date?: string | null;
    second_payment_amount?: number;
    second_payment_type?: PaymentValueType;
    second_payment_date?: string | null;
    final_payment_amount?: number;
    final_payment_type?: PaymentValueType;
    final_payment_date?: string | null;
  } | null;
}

interface DestinationBooking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
  destinations: {
    name: string;
    country: string;
    image_url: string | null;
  } | null;
}

interface BookingsListProps {
  tripBookings: TripBooking[] | undefined;
  tripBookingsLoading: boolean;
  destinationBookings: DestinationBooking[] | undefined;
  onTripBookingClick: (booking: TripBooking) => void;
  onDestinationBookingClick: (booking: DestinationBooking) => void;
}

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

interface NextPayment {
  amount: number;
  dueDate: string;
  label: string;
}

function getNextPayment(
  booking: TripBooking,
  paidTypes: Set<string>,
  userId?: string
): NextPayment | null {
  if (!booking.trips) return null;

  const trip = booking.trips;
  const isBooker = booking.user_id === userId;
  const travelers = booking.travelers || 1;
  const totalPrice = isBooker
    ? Number(booking.total_price)
    : Math.ceil(Number(booking.total_price) / travelers);

  const plan = [
    {
      type: "first_payment",
      amount: trip.first_payment_amount || 0,
      payType: (trip.first_payment_type || "amount") as PaymentValueType,
      date: trip.first_payment_date,
      label: "Delbetalning 1",
    },
    {
      type: "second_payment",
      amount: trip.second_payment_amount || 0,
      payType: (trip.second_payment_type || "amount") as PaymentValueType,
      date: trip.second_payment_date,
      label: "Delbetalning 2",
    },
    {
      type: "final_payment",
      amount: trip.final_payment_amount || 0,
      payType: (trip.final_payment_type || "amount") as PaymentValueType,
      date: trip.final_payment_date,
      label: "Slutbetalning",
    },
  ];

  for (const p of plan) {
    if (p.amount > 0 && p.date && !paidTypes.has(p.type)) {
      return {
        amount: calculatePaymentAmount(p.amount, p.payType, totalPrice),
        dueDate: p.date,
        label: p.label,
      };
    }
  }
  return null;
}

export const BookingsList = ({
  tripBookings,
  tripBookingsLoading,
  destinationBookings,
  onTripBookingClick,
  onDestinationBookingClick,
}: BookingsListProps) => {
  const { user } = useAuth();

  // Fetch payments to determine which are already paid
  const { data: payments } = useQuery({
    queryKey: ["booking-list-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("trip_booking_id, payment_type, status")
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Map of booking id -> set of paid payment types
  const paidByBooking = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    payments?.forEach((p) => {
      if (!map[p.trip_booking_id]) map[p.trip_booking_id] = new Set();
      map[p.trip_booking_id].add(p.payment_type);
    });
    return map;
  }, [payments]);

  return (
    <div className="space-y-12">
      {/* Trip Bookings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Mina resebokningar
          </h2>
          <Link to="/search">
            <Button className="bg-gradient-ocean hover:opacity-90">
              Boka ny resa
            </Button>
          </Link>
        </div>

        {tripBookingsLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="w-32 h-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tripBookings && tripBookings.length > 0 ? (
          <div className="space-y-4">
            {tripBookings.map((booking, index) => {
              const nextPayment = getNextPayment(
                booking,
                paidByBooking[booking.id] || new Set(),
                user?.id
              );
              const isOverdue = nextPayment
                ? new Date(nextPayment.dueDate) < new Date()
                : false;

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                    {/* Left box: Trip info */}
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => onTripBookingClick(booking)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-serif font-semibold text-foreground">
                                {booking.trips?.name}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            {booking.trips?.trip_type && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {formatTripType(booking.trips.trip_type)}
                              </p>
                            )}
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-ocean" />
                                <span>
                                  {booking.trips?.departure_date &&
                                    format(
                                      new Date(booking.trips.departure_date),
                                      "d MMMM",
                                      { locale: sv }
                                    )}{" "}
                                  –{" "}
                                  {booking.trips?.return_date &&
                                    format(
                                      new Date(booking.trips.return_date),
                                      "d MMMM yyyy",
                                      { locale: sv }
                                    )}
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

                    {/* Right box: Next payment */}
                    <Card
                      className={`md:w-64 flex flex-col justify-center ${
                        isOverdue
                          ? "border-destructive/50 bg-destructive/5"
                          : ""
                      }`}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        {nextPayment ? (
                          <>
                            <div>
                              <p className="text-2xl font-bold text-foreground">
                                {nextPayment.amount.toLocaleString("sv-SE")} kr
                              </p>
                              <p className={`text-sm mt-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                {isOverdue
                                  ? "Förfallen"
                                  : `Förfaller ${format(new Date(nextPayment.dueDate), "d MMMM yyyy", { locale: sv })}`}
                              </p>
                            </div>
                            <Button
                              className="w-full bg-gradient-ocean hover:opacity-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTripBookingClick(booking);
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Betala nu
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="w-6 h-6 text-palm" />
                            <p className="text-sm font-medium text-palm">
                              Allt betalt
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="bg-gradient-card">
            <CardHeader className="text-center py-8">
              <div className="mx-auto mb-4 p-4 rounded-full bg-ocean-light w-fit">
                <Plane className="w-8 h-8 text-ocean" />
              </div>
              <CardTitle className="font-serif">
                Inga resebokningar ännu
              </CardTitle>
              <CardDescription className="text-lg">
                Utforska våra fantastiska resor och boka din första resa!
              </CardDescription>
              <Link to="/search" className="mt-6 inline-block">
                <Button size="lg" className="bg-gradient-ocean hover:opacity-90">
                  Sök resor
                </Button>
              </Link>
            </CardHeader>
          </Card>
        )}
      </motion.div>

      {/* Destination Bookings Section (legacy) */}
      {destinationBookings && destinationBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-semibold text-foreground">
              Destinationsbokningar
            </h2>
            <Link to="/destinations">
              <Button variant="outline">Boka destination</Button>
            </Link>
          </div>

          <div className="space-y-4">
            {destinationBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => onDestinationBookingClick(booking)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-48 md:h-auto">
                        <img
                          src={booking.destinations?.image_url || ""}
                          alt={booking.destinations?.name || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-serif font-semibold text-foreground">
                                {booking.destinations?.name}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            <p className="text-muted-foreground flex items-center gap-2 mb-4">
                              <MapPin className="w-4 h-4" />
                              {booking.destinations?.country}
                            </p>
                            <div className="flex flex-wrap gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-ocean" />
                                <span>
                                  {format(new Date(booking.check_in), "d MMM", {
                                    locale: sv,
                                  })}{" "}
                                  -{" "}
                                  {format(
                                    new Date(booking.check_out),
                                    "d MMM yyyy",
                                    { locale: sv }
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-ocean" />
                                <span>{booking.guests} gäster</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                              <CreditCard className="w-5 h-5 text-sunset" />
                              {Number(booking.total_price).toLocaleString(
                                "sv-SE"
                              )}{" "}
                              kr
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Bokad{" "}
                              {format(
                                new Date(booking.created_at),
                                "d MMM yyyy",
                                { locale: sv }
                              )}
                            </p>
                            <div className="flex items-center gap-1 text-sm text-ocean mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Visa detaljer</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
