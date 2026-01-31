import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Cake,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface TripBookingDetailsDialogProps {
  booking: {
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
    trips: {
      name: string;
      trip_type: string;
      departure_date: string;
      return_date: string;
      departure_location: string;
      price: number;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TripBookingDetailsDialog = ({
  booking,
  open,
  onOpenChange,
}: TripBookingDetailsDialogProps) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  const handlePayment = async () => {
    if (!booking) return;
    setIsProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-booking-payment",
        {
          body: {
            bookingId: booking.id,
            amount: booking.total_price,
            bookingType: "trip",
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Kunde inte starta betalningen. Försök igen.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!booking) return null;

  const isPaid = booking.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl font-serif">
              {booking.trips?.name}
            </DialogTitle>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {booking.trips && formatTripType(booking.trips.trip_type)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={isPaid ? "default" : "secondary"}
                className={isPaid ? "bg-palm" : ""}
              >
                {isPaid ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Bekräftad & Betald
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Väntar på betalning
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                #{booking.id.slice(0, 8).toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="passenger" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="passenger">
              <Users className="w-4 h-4 mr-2" />
              Resenär
            </TabsTrigger>
            <TabsTrigger value="trip">
              <MapPin className="w-4 h-4 mr-2" />
              Resa
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="w-4 h-4 mr-2" />
              Betalning
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Passenger Tab */}
            <TabsContent value="passenger" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-ocean" />
                      Resenärinformation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Namn</p>
                        <p className="font-medium">
                          {booking.first_name} {booking.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> E-post
                        </p>
                        <p className="font-medium">{booking.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Telefon
                        </p>
                        <p className="font-medium">{booking.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Cake className="w-3 h-3" /> Födelsedatum
                        </p>
                        <p className="font-medium">
                          {format(new Date(booking.birth_date), "d MMMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Antal resenärer
                        </p>
                        <p className="font-medium">
                          {booking.travelers} person{booking.travelers > 1 ? "er" : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avgångsort
                        </p>
                        <p className="font-medium">{booking.departure_location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Trip Info Tab */}
            <TabsContent value="trip" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-ocean" />
                      Reseinformation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Resa</p>
                        <p className="font-medium">{booking.trips?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Restyp</p>
                        <p className="font-medium">
                          {booking.trips && formatTripType(booking.trips.trip_type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avresa</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-ocean" />
                          {booking.trips?.departure_date &&
                            format(
                              new Date(booking.trips.departure_date),
                              "d MMMM yyyy",
                              { locale: sv }
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hemresa</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-sunset" />
                          {booking.trips?.return_date &&
                            format(
                              new Date(booking.trips.return_date),
                              "d MMMM yyyy",
                              { locale: sv }
                            )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Antal dagar
                        </p>
                        <p className="font-medium">
                          {booking.trips?.departure_date &&
                            booking.trips?.return_date &&
                            Math.ceil(
                              (new Date(booking.trips.return_date).getTime() -
                                new Date(booking.trips.departure_date).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                          dagar
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bokad</p>
                        <p className="font-medium">
                          {format(new Date(booking.created_at), "d MMMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-ocean" />
                      Betalningsöversikt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">
                          Pris per person
                        </span>
                        <span className="font-medium">
                          {booking.trips?.price?.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">
                          Antal resenärer
                        </span>
                        <span className="font-medium">{booking.travelers}</span>
                      </div>
                      {booking.discount_code && (
                        <div className="flex justify-between items-center py-2 border-b text-palm">
                          <span className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            Rabatt ({booking.discount_code})
                          </span>
                          <span className="font-medium">
                            -{booking.discount_amount?.toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3">
                        <span className="font-semibold text-lg">Totalt</span>
                        <span className="font-bold text-2xl text-ocean">
                          {Number(booking.total_price).toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    </div>

                    <div className="pt-4">
                      {isPaid ? (
                        <div className="flex items-center justify-center gap-2 p-4 bg-palm/10 rounded-lg text-palm">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">
                            Betalning genomförd
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-sunset/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              Din bokning är reserverad. Slutför betalningen för
                              att bekräfta din plats.
                            </p>
                          </div>
                          <Button
                            onClick={handlePayment}
                            className="w-full bg-gradient-ocean hover:opacity-90 h-12 text-lg font-semibold"
                            disabled={isProcessingPayment}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Förbereder betalning...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Betala {Number(booking.total_price).toLocaleString("sv-SE")} kr
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
