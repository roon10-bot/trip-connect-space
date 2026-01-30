import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  Users,
  Plane,
  Building2,
  FileText,
  CreditCard,
  MapPin,
  Calendar,
  Clock,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface BookingDetailsDialogProps {
  booking: {
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
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookingDetailsDialog = ({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch profile data
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
    enabled: !!user?.id && open,
  });

  // Fetch flight data
  const { data: flights, isLoading: flightsLoading } = useQuery({
    queryKey: ["booking-flights", booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      const { data, error } = await supabase
        .from("booking_flights")
        .select("*")
        .eq("booking_id", booking.id)
        .order("departure_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id && open,
  });

  // Fetch accommodation data
  const { data: accommodations, isLoading: accommodationsLoading } = useQuery({
    queryKey: ["booking-accommodations", booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      const { data, error } = await supabase
        .from("booking_accommodations")
        .select("*")
        .eq("booking_id", booking.id);
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id && open,
  });

  // Fetch attachments
  const { data: attachments, isLoading: attachmentsLoading } = useQuery({
    queryKey: ["booking-attachments", booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      const { data, error } = await supabase
        .from("booking_attachments")
        .select("*")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id && open,
  });

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

  const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("booking-attachments")
        .download(fileUrl.split("/").pop() || "");

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Kunde inte ladda ner filen");
    }
  };

  if (!booking) return null;

  const isPaid = booking.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {booking.destinations?.image_url && (
              <img
                src={booking.destinations.image_url}
                alt={booking.destinations.name || ""}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div>
              <DialogTitle className="text-2xl font-serif">
                {booking.destinations?.name}
              </DialogTitle>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {booking.destinations?.country}
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
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="passengers" className="mt-6">
          <TabsList className="grid w-full grid-cols-6 gap-1">
            <TabsTrigger value="passengers" className="text-xs sm:text-sm">
              <Users className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Passagerare</span>
            </TabsTrigger>
            <TabsTrigger value="trip" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Resa</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="text-xs sm:text-sm">
              <Plane className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Flyg</span>
            </TabsTrigger>
            <TabsTrigger value="accommodation" className="text-xs sm:text-sm">
              <Building2 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Boende</span>
            </TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs sm:text-sm">
              <FileText className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Bilagor</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm">
              <CreditCard className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Betalning</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Passengers Tab */}
            <TabsContent value="passengers" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-ocean" />
                      Passagerarinformation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Namn</p>
                        <p className="font-medium">
                          {profile?.full_name || user?.email?.split("@")[0]}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">E-post</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">
                          {profile?.phone || "Ej angiven"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Antal resenärer
                        </p>
                        <p className="font-medium">{booking.guests} personer</p>
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
                        <p className="text-sm text-muted-foreground">
                          Destination
                        </p>
                        <p className="font-medium">
                          {booking.destinations?.name},{" "}
                          {booking.destinations?.country}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bokningsnummer
                        </p>
                        <p className="font-medium font-mono text-sm">
                          {booking.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Incheckning
                        </p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-ocean" />
                          {format(new Date(booking.check_in), "d MMMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Utcheckning
                        </p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-sunset" />
                          {format(new Date(booking.check_out), "d MMMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Antal nätter
                        </p>
                        <p className="font-medium">
                          {Math.ceil(
                            (new Date(booking.check_out).getTime() -
                              new Date(booking.check_in).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          nätter
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bokad
                        </p>
                        <p className="font-medium">
                          {format(
                            new Date(booking.created_at),
                            "d MMMM yyyy",
                            { locale: sv }
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Flights Tab */}
            <TabsContent value="flights" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="w-5 h-5 text-ocean" />
                      Flyginformation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {flightsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : flights && flights.length > 0 ? (
                      <div className="space-y-4">
                        {flights.map((flight, index) => (
                          <div
                            key={flight.id}
                            className="p-4 rounded-lg bg-muted/50 border"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline">
                                {index === 0 ? "Utresa" : "Hemresa"}
                              </Badge>
                              {flight.airline && (
                                <span className="text-sm text-muted-foreground">
                                  {flight.airline}{" "}
                                  {flight.flight_number && `- ${flight.flight_number}`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-2xl font-bold">
                                  {format(
                                    new Date(flight.departure_time),
                                    "HH:mm"
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {flight.departure_city}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(flight.departure_time),
                                    "d MMM",
                                    { locale: sv }
                                  )}
                                </p>
                              </div>
                              <div className="flex-1 mx-4">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-ocean" />
                                  <div className="flex-1 h-px bg-border mx-2" />
                                  <Plane className="w-4 h-4 text-ocean" />
                                  <div className="flex-1 h-px bg-border mx-2" />
                                  <div className="w-2 h-2 rounded-full bg-sunset" />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold">
                                  {format(
                                    new Date(flight.arrival_time),
                                    "HH:mm"
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {flight.arrival_city}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(flight.arrival_time),
                                    "d MMM",
                                    { locale: sv }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Flyginformation har inte lagts till ännu</p>
                        <p className="text-sm">
                          Vi kommer lägga till information när resan är bekräftad
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Accommodation Tab */}
            <TabsContent value="accommodation" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-ocean" />
                      Boendeinformation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {accommodationsLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : accommodations && accommodations.length > 0 ? (
                      <div className="space-y-4">
                        {accommodations.map((accommodation) => (
                          <div
                            key={accommodation.id}
                            className="p-4 rounded-lg bg-muted/50 border"
                          >
                            <h4 className="font-semibold text-lg mb-2">
                              {accommodation.hotel_name}
                            </h4>
                            {accommodation.address && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                                <MapPin className="w-4 h-4" />
                                {accommodation.address}
                              </p>
                            )}
                            <div className="grid sm:grid-cols-3 gap-4 text-sm">
                              {accommodation.room_type && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Rumstyp
                                  </p>
                                  <p className="font-medium">
                                    {accommodation.room_type}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground">
                                  Incheckning
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {accommodation.check_in_time}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Utcheckning
                                </p>
                                <p className="font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {accommodation.check_out_time}
                                </p>
                              </div>
                            </div>
                            {accommodation.amenities &&
                              accommodation.amenities.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm text-muted-foreground mb-1">
                                    Bekvämligheter
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {accommodation.amenities.map((amenity, i) => (
                                      <Badge key={i} variant="secondary">
                                        {amenity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {accommodation.notes && (
                              <div className="mt-3 p-3 bg-background rounded border">
                                <p className="text-sm">{accommodation.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Boendeinformation har inte lagts till ännu</p>
                        <p className="text-sm">
                          Vi kommer lägga till information när resan är bekräftad
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-ocean" />
                      Dokument & Bilagor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attachmentsLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : attachments && attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-ocean-light">
                                <FileText className="w-4 h-4 text-ocean" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {attachment.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uppladdad{" "}
                                  {format(
                                    new Date(attachment.created_at),
                                    "d MMM yyyy",
                                    { locale: sv }
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadAttachment(
                                  attachment.file_url,
                                  attachment.file_name
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Inga dokument har laddats upp ännu</p>
                        <p className="text-sm">
                          Dokument som bokningsbekräftelse och reseinformation
                          kommer visas här
                        </p>
                      </div>
                    )}
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
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-ocean" />
                      Betalning
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-muted-foreground">
                          Resepaket till {booking.destinations?.name}
                        </span>
                        <span className="font-medium">
                          {Number(booking.total_price).toLocaleString("sv-SE")}{" "}
                          kr
                        </span>
                      </div>
                      <div className="border-t pt-4 flex justify-between items-center">
                        <span className="font-semibold">Totalt att betala</span>
                        <span className="text-2xl font-bold text-ocean">
                          {Number(booking.total_price).toLocaleString("sv-SE")}{" "}
                          kr
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div>
                        <p className="font-medium">Betalningsstatus</p>
                        <p className="text-sm text-muted-foreground">
                          {isPaid
                            ? "Din betalning har genomförts"
                            : "Väntar på betalning"}
                        </p>
                      </div>
                      <Badge
                        variant={isPaid ? "default" : "secondary"}
                        className={isPaid ? "bg-palm" : ""}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Betald
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Obetald
                          </>
                        )}
                      </Badge>
                    </div>

                    {!isPaid && (
                      <Button
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="w-full bg-gradient-ocean hover:opacity-90"
                        size="lg"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Förbereder betalning...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Betala{" "}
                            {Number(booking.total_price).toLocaleString(
                              "sv-SE"
                            )}{" "}
                            kr
                          </>
                        )}
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      Säker betalning via Stripe. Vi accepterar Visa, Mastercard
                      och fler.
                    </p>
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
