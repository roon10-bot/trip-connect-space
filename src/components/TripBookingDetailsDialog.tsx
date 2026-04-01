import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react";
import klarnaBadge from "@/assets/klarna-badge.png";
import swishLogo from "@/assets/swish-logo.png";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Wallet,
  Plane,
  Home,
  BedDouble,
  Maximize,
  WifiIcon,
} from "lucide-react";
import { toast } from "sonner";
import { calculatePaymentAmount, resolvePaymentPlan, type PaymentValueType } from "@/lib/paymentCalculations";
import { TripImageCarousel } from "./TripImageCarousel";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  Wallet,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import { calculatePaymentAmount, resolvePaymentPlan, type PaymentValueType } from "@/lib/paymentCalculations";

interface PaymentPlan {
  first_payment_amount: number;
  first_payment_type: PaymentValueType;
  first_payment_date: string | null;
  second_payment_amount: number;
  second_payment_type: PaymentValueType;
  second_payment_date: string | null;
  final_payment_amount: number;
  final_payment_type: PaymentValueType;
  final_payment_date: string | null;
}

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
    user_id?: string | null;
    trips: {
      id?: string;
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
      accommodation_address?: string | null;
      accommodation_description?: string | null;
      accommodation_facilities?: string[] | null;
      accommodation_rooms?: number | null;
      accommodation_size_sqm?: number | null;
      image_url?: string | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

interface PaymentOption {
  id: string;
  label: string;
  amount: number;
  date: string | null;
  isAvailable: boolean;
}

export const TripBookingDetailsDialog = ({
  booking,
  open,
  onOpenChange,
  defaultTab = "passenger",
}: TripBookingDetailsDialogProps) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<"altapay_card" | "altapay_swish" | "stripe_klarna">("altapay_card");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [swishQrData, setSwishQrData] = useState<{ url: string; paymentId: string } | null>(null);
  const [swishPollStatus, setSwishPollStatus] = useState<"polling" | "paid" | "error" | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Clean up polling on unmount or dialog close
  useEffect(() => {
    if (!open) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSwishQrData(null);
      setSwishPollStatus(null);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [open]);

  // Fetch completed payments for this booking
  const { data: completedPayments } = useQuery({
    queryKey: ["booking-completed-payments", booking?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount")
        .eq("trip_booking_id", booking!.id)
        .eq("status", "completed");
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id && open,
  });

  // Fetch flight data for this booking
  const { data: flightData } = useQuery({
    queryKey: ["booking-flight-data", booking?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_booking_flights")
        .select("*")
        .eq("trip_booking_id", booking!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!booking?.id && open,
  });

  const totalPaid = useMemo(() => {
    if (!completedPayments) return 0;
    return completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [completedPayments]);

  const isFullyPaid = totalPaid >= Number(booking?.total_price || 0) && totalPaid > 0;

  // Determine if user is the booker or a traveler
  const isBooker = booking?.user_id === user?.id;
  const travelers = booking?.travelers || 1;

  // Per-person share: if traveler (not booker), divide total by number of travelers
  const effectiveTotal = useMemo(() => {
    if (!booking) return 0;
    const total = Number(booking.total_price);
    return isBooker ? total : Math.ceil(total / travelers);
  }, [booking, isBooker, travelers]);

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  // Build payment options from trip data with calculated amounts, marking paid items
  const paymentOptions: PaymentOption[] = useMemo(() => {
    if (!booking?.trips) return [];
    
    const trip = booking.trips;
    const totalPrice = effectiveTotal;
    
    const planItems = resolvePaymentPlan(trip, totalPrice, booking.created_at);

    // Use cumulative logic to determine which items are already paid
    let cumulativeAmount = 0;
    return planItems.map((item) => {
      cumulativeAmount += item.amount;
      const isPaid = item.amount > 0 && totalPaid >= cumulativeAmount;
      return {
        id: item.type === "first_payment" ? "first" 
          : item.type === "second_payment" ? "second" 
          : item.type === "final_payment" ? "final" 
          : "full",
        label: item.label,
        amount: item.amount,
        date: item.date || null,
        isAvailable: !isPaid,
      };
    });
  }, [booking?.trips, booking?.total_price, booking?.created_at, effectiveTotal, totalPaid]);

  // Calculate selected amount
  const remainingBalance = useMemo(() => {
    return Math.max(0, effectiveTotal - totalPaid);
  }, [effectiveTotal, totalPaid]);

  // Minimum custom amount = first unpaid payment option amount
  const minCustomAmount = useMemo(() => {
    const firstUnpaid = paymentOptions.find(opt => opt.isAvailable);
    if (!firstUnpaid) return 1;
    return firstUnpaid.amount || 1;
  }, [paymentOptions]);

  const parsedCustomAmount = useMemo(() => {
    const val = Number(customAmount);
    if (isNaN(val) || val < minCustomAmount) return 0;
    return Math.min(val, remainingBalance);
  }, [customAmount, remainingBalance, minCustomAmount]);

  const selectedAmount = useMemo(() => {
    const planTotal = paymentOptions
      .filter((opt) => selectedPayments.has(opt.id))
      .reduce((sum, opt) => sum + opt.amount, 0);
    return useCustomAmount ? parsedCustomAmount : planTotal;
  }, [paymentOptions, selectedPayments, useCustomAmount, parsedCustomAmount]);

  const togglePayment = (paymentId: string) => {
    // Don't allow toggling paid items
    const option = paymentOptions.find(o => o.id === paymentId);
    if (option && !option.isAvailable) return;
    
    setUseCustomAmount(false);
    setSelectedPayments((prev) => {
      const next = new Set(prev);
      if (next.has(paymentId)) {
        next.delete(paymentId);
      } else {
        next.add(paymentId);
      }
      return next;
    });
  };

  const selectAllPayments = () => {
    setUseCustomAmount(false);
    setSelectedPayments(new Set(paymentOptions.filter(opt => opt.isAvailable).map((opt) => opt.id)));
  };

  const handleCustomAmountToggle = () => {
    if (!useCustomAmount) {
      setUseCustomAmount(true);
      setSelectedPayments(new Set());
    } else {
      setUseCustomAmount(false);
      setCustomAmount("");
    }
  };

  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const handlePayment = async () => {
    if (!booking) return;
    setShowPaymentConfirm(false);

    try {
      // Verify session is still valid before attempting payment
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast.error("Din session har gått ut. Logga in igen för att betala.");
        return;
      }

      setIsProcessingPayment(true);

      const isKlarna = paymentMethod === "stripe_klarna";
      const isSwish = paymentMethod === "altapay_swish";
      const isCard = paymentMethod === "altapay_card";

      // Determine payment_type from selected payment options
      const selectedIds = Array.from(selectedPayments);
      const paymentTypeMap: Record<string, string> = {
        first: "first_payment",
        second: "second_payment",
        final: "final_payment",
      };
      const resolvedPaymentType = !useCustomAmount && selectedIds.length === 1
        ? paymentTypeMap[selectedIds[0]] || "installment"
        : useCustomAmount
          ? "custom_payment"
          : "combined_payment";

      // Build Swish phone if needed
      let formattedPhone: string | undefined;
      if (isSwish) {
        const rawPhone = (booking.phone || "").replace(/[\s\-()]/g, "");
        formattedPhone = rawPhone.startsWith("0")
          ? `46${rawPhone.substring(1)}`
          : rawPhone.startsWith("46")
            ? rawPhone
            : `46${rawPhone}`;

        if (formattedPhone.length < 10 || formattedPhone.length > 15) {
          toast.error("Saknar giltigt telefonnummer på bokningen. Uppdatera ditt nummer och försök igen.");
          setIsProcessingPayment(false);
          return;
        }
      }

      const isNativeApp = Capacitor.isNativePlatform();
      const isDesktop = !isMobile && !isNativeApp;

      // Unified call to create-booking-payment
      const { data, error } = await supabase.functions.invoke("create-booking-payment", {
        body: {
          booking_id: booking.id,
          amount: selectedAmount,
          payment_method: isCard ? "card" : isSwish ? "swish" : "klarna",
          bookingType: "trip",
          payment_type: resolvedPaymentType,
          // Swish-specific params
          payer_phone: isSwish && isNativeApp ? formattedPhone : undefined,
          is_desktop: isSwish ? isDesktop : undefined,
          is_native_app: isSwish ? isNativeApp : undefined,
        },
      });

      if (error) throw error;

      // Handle response based on payment method
      if (isSwish && data?.success) {
        const appSwitchToken = data.payment_request_token || data.swish_payment_id;
        const swishPaymentId = data.swish_payment_id || appSwitchToken;

        if (!appSwitchToken) {
          toast.success("Öppna Swish-appen på din telefon för att slutföra betalningen.");
          setIsProcessingPayment(false);
          return;
        }

        const callbackUrl = encodeURIComponent(window.location.origin + "/dashboard?payment=success");
        const swishUrl = `swish://paymentrequest?token=${appSwitchToken}&callbackurl=${callbackUrl}`;

        if (isDesktop) {
          // Desktop: show QR code with Swish D-prefix format
          const qrContent = `D${appSwitchToken}`;
          setSwishQrData({ url: qrContent, paymentId: swishPaymentId });
        } else if (!isNativeApp) {
          // Mobile web: show "Open Swish" button + poll
          setSwishQrData({ url: swishUrl, paymentId: swishPaymentId });
        }

        if (!isNativeApp) {
          // Start polling for both desktop QR and mobile web
          setSwishPollStatus("polling");

          pollIntervalRef.current = setInterval(async () => {
            try {
              const { data: payment } = await supabase
                .from("payments")
                .select("status")
                .eq("provider_transaction_id", swishPaymentId)
                .maybeSingle();

              if (payment?.status === "completed") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setSwishPollStatus("paid");
                toast.success("Betalningen genomförd!");
              } else if (payment?.status === "failed") {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                setSwishPollStatus("error");
                toast.error("Betalningen misslyckades. Försök igen.");
              }
            } catch (e) {
              console.warn("Poll error", e);
            }
          }, 3000);

          setTimeout(() => {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              if (swishPollStatus === "polling") {
                setSwishPollStatus("error");
                toast.error("Tidsgränsen gick ut. Försök igen.");
              }
            }
          }, 5 * 60 * 1000);

          return;
        }

        // Native app (Capacitor): use AppLauncher for reliable deep-linking
        try {
          const canOpen = await AppLauncher.canOpenUrl({ url: "swish://" });
          if (canOpen.value) {
            await AppLauncher.openUrl({ url: swishUrl });
            return;
          }
        } catch (launchError) {
          console.warn("Native Swish launch failed", launchError);
        }

        // Native fallback
        window.location.assign(swishUrl);
      } else if (data?.payment_url) {
        // AltaPay card - redirect to payment gateway
        window.location.href = data.payment_url;
      } else if (data?.url) {
        // Klarna/Stripe - redirect to checkout
        window.location.href = data.url;
      } else {
        throw new Error("Ingen betalnings-URL mottogs");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      const msg = error?.message?.includes("Auth session missing")
        ? "Din session har gått ut. Logga in igen för att betala."
        : "Kunde inte starta betalningen. Försök igen.";
      toast.error(msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!booking) return null;

  const isPaid = isFullyPaid;
  const hasPaymentPlan = paymentOptions.length > 0;
  const confirmPaymentAmount = hasPaymentPlan ? selectedAmount : Number(booking?.total_price || 0);

  const handlePaymentClick = () => {
    if (!booking || confirmPaymentAmount <= 0) return;
    setShowPaymentConfirm(true);
  };

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

        <Tabs defaultValue={defaultTab} key={defaultTab} className="mt-6">
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

                {/* Flight Info */}
                {flightData && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="w-5 h-5 text-ocean" />
                        Flygdetaljer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {flightData.airline && (
                        <div className="flex items-center gap-3">
                          {flightData.airline_logo && (
                            <img src={flightData.airline_logo} alt={flightData.airline} className="w-8 h-8 object-contain" />
                          )}
                          <span className="font-medium">{flightData.airline}</span>
                          <span className="text-sm text-muted-foreground">
                            {flightData.passengers} passagerare
                          </span>
                        </div>
                      )}

                      {/* Outbound */}
                      {flightData.outbound_origin && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Utresa</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{flightData.outbound_origin}</p>
                              {flightData.outbound_departure_time && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(flightData.outbound_departure_time), "d MMM HH:mm", { locale: sv })}
                                </p>
                              )}
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                              {flightData.outbound_stops === 0 ? "Direkt" : `${flightData.outbound_stops} stopp`}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{flightData.outbound_destination}</p>
                              {flightData.outbound_arrival_time && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(flightData.outbound_arrival_time), "d MMM HH:mm", { locale: sv })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Return */}
                      {flightData.return_origin && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Hemresa</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{flightData.return_origin}</p>
                              {flightData.return_departure_time && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(flightData.return_departure_time), "d MMM HH:mm", { locale: sv })}
                                </p>
                              )}
                            </div>
                            <div className="text-center text-xs text-muted-foreground">
                              {flightData.return_stops === 0 ? "Direkt" : `${flightData.return_stops} stopp`}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{flightData.return_destination}</p>
                              {flightData.return_arrival_time && (
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(flightData.return_arrival_time), "d MMM HH:mm", { locale: sv })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
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
                          {Math.ceil(Number(booking.total_price) / (booking.travelers || 1)).toLocaleString("sv-SE")} kr
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
                        <span className="font-semibold text-lg">
                          {isBooker ? "Totalt att betala" : "Din del att betala"}
                        </span>
                        <span className="font-bold text-2xl text-ocean">
                          {effectiveTotal.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                      {remainingBalance > 0 && remainingBalance < effectiveTotal && (
                        <div className="flex justify-between items-center py-2 px-3 text-sm">
                          <span className="text-muted-foreground">Kvar att betala</span>
                          <span className="font-semibold text-sunset">
                            {remainingBalance.toLocaleString("sv-SE")} kr
                          </span>
                        </div>
                      )}
                      {!isBooker && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Totalt för bokningen: {Number(booking.total_price).toLocaleString("sv-SE")} kr ({booking.travelers} resenärer)
                        </p>
                      )}
                    </div>

                    {/* Payment Plan Section */}
                    {!isPaid && hasPaymentPlan && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-foreground">Betalningsplan</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAllPayments}
                            className="text-sm text-ocean hover:text-ocean/80"
                          >
                            Välj alla
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Välj de betalningar du vill genomföra nu:
                        </p>
                        
                        <div className="space-y-3">
                          {paymentOptions.map((option) => {
                            const isPaidItem = !option.isAvailable;
                            return (
                            <label
                              key={option.id}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                isPaidItem
                                  ? "border-palm/30 bg-palm/5 cursor-default"
                                  : selectedPayments.has(option.id)
                                  ? "border-ocean bg-ocean/5 cursor-pointer"
                                  : "border-border hover:border-ocean/50 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isPaidItem ? (
                                  <CheckCircle className="w-5 h-5 text-palm shrink-0" />
                                ) : (
                                  <Checkbox
                                    checked={selectedPayments.has(option.id)}
                                    onCheckedChange={() => togglePayment(option.id)}
                                    className="data-[state=checked]:bg-ocean data-[state=checked]:border-ocean"
                                  />
                                )}
                                <div>
                                  <p className={`font-medium ${isPaidItem ? "text-palm" : ""}`}>{option.label}</p>
                                  {option.date && (
                                    <p className={`text-sm ${isPaidItem ? "text-palm/70" : "text-muted-foreground"}`}>
                                      {isPaidItem ? "Betald" : `Förfaller: ${format(new Date(option.date), "d MMMM yyyy", { locale: sv })}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className={`font-semibold text-lg ${isPaidItem ? "text-palm" : ""}`}>
                                {option.amount.toLocaleString("sv-SE")} kr
                              </span>
                            </label>
                            );
                          })}
                        </div>

                        {/* Custom Amount Option */}
                        <label
                          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all mt-3 ${
                            useCustomAmount
                              ? "border-ocean bg-ocean/5"
                              : "border-border hover:border-ocean/50"
                          }`}
                          onClick={(e) => { e.preventDefault(); handleCustomAmountToggle(); }}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={useCustomAmount}
                              onCheckedChange={handleCustomAmountToggle}
                              className="data-[state=checked]:bg-ocean data-[state=checked]:border-ocean"
                            />
                            <div>
                              <p className="font-medium">Valfritt belopp</p>
                              <p className="text-sm text-muted-foreground">
                                Min {minCustomAmount.toLocaleString("sv-SE")} kr · Max {remainingBalance.toLocaleString("sv-SE")} kr
                              </p>
                            </div>
                          </div>
                          {useCustomAmount && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                min={minCustomAmount}
                                max={remainingBalance}
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="0"
                                className="w-28 text-right text-lg font-semibold"
                                autoFocus
                              />
                              <span className="font-semibold text-lg">kr</span>
                            </div>
                          )}
                        </label>

                        {/* Validation message for custom amount below minimum */}
                        {useCustomAmount && customAmount !== "" && Number(customAmount) > 0 && Number(customAmount) < minCustomAmount && (
                          <p className="text-sm text-destructive mt-2">
                            Minsta belopp att betala är {minCustomAmount.toLocaleString("sv-SE")} kr
                          </p>
                        )}

                        {/* Selected Amount Summary */}
                        {(selectedPayments.size > 0 || (useCustomAmount && parsedCustomAmount > 0)) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-4 bg-ocean/10 rounded-lg border border-ocean/20"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                {useCustomAmount ? "Valfritt belopp" : `${selectedPayments.size} betalning${selectedPayments.size > 1 ? "ar" : ""} valda`}
                              </span>
                              <span className="font-bold text-xl text-ocean">
                                {selectedAmount.toLocaleString("sv-SE")} kr
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

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
                          {!hasPaymentPlan && (
                            <div className="p-4 bg-sunset/10 rounded-lg">
                              <p className="text-sm text-muted-foreground mb-2">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                Din bokning är reserverad. Slutför betalningen för
                                att bekräfta din plats.
                              </p>
                            </div>
                          )}

                          {/* Payment Method Selector */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">Välj betalningsmetod</p>
                            <div className="grid grid-cols-3 gap-3">
                              <label
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  paymentMethod === "altapay_card"
                                    ? "border-ocean bg-ocean/5"
                                    : "border-border hover:border-ocean/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="altapay_card"
                                  checked={paymentMethod === "altapay_card"}
                                  onChange={() => setPaymentMethod("altapay_card")}
                                  className="sr-only"
                                />
                                <CreditCard className="w-6 h-6 text-ocean" />
                                <span className="text-sm font-medium">Kort</span>
                              </label>
                              <label
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  paymentMethod === "altapay_swish"
                                    ? "border-ocean bg-ocean/5"
                                    : "border-border hover:border-ocean/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="altapay_swish"
                                  checked={paymentMethod === "altapay_swish"}
                                  onChange={() => setPaymentMethod("altapay_swish")}
                                  className="sr-only"
                                />
                                <img src={swishLogo} alt="Swish" className="h-8" />
                              </label>
                              
                              
                              <label
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  paymentMethod === "stripe_klarna"
                                    ? "border-ocean bg-ocean/5"
                                    : "border-border hover:border-ocean/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="stripe_klarna"
                                  checked={paymentMethod === "stripe_klarna"}
                                  onChange={() => setPaymentMethod("stripe_klarna")}
                                  className="sr-only"
                                />
                                <img src={klarnaBadge} alt="Klarna" className="h-7" />
                                
                              </label>
                            </div>
                          </div>
                          
                          {hasPaymentPlan ? (
                            <Button
                              onClick={handlePaymentClick}
                              className="w-full bg-gradient-ocean hover:opacity-90 h-12 text-lg font-semibold"
                              disabled={isProcessingPayment || selectedAmount <= 0}
                            >
                              {isProcessingPayment ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Förbereder betalning...
                                </>
                              ) : selectedAmount <= 0 ? (
                                <>
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Välj minst en betalning
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Betala {selectedAmount.toLocaleString("sv-SE")} kr
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              onClick={handlePaymentClick}
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
                          )}

                          <AlertDialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Bekräfta betalning</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                  <div>
                                    Du kommer att betala <strong>{confirmPaymentAmount.toLocaleString("sv-SE")} kr</strong> via {paymentMethod === "altapay_swish" ? "Swish" : paymentMethod === "stripe_klarna" ? "Klarna" : "kortbetalning"}. Vill du fortsätta?
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePayment}>Ja, betala</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Swish Payment Dialog (QR for Desktop, Button for Mobile Web) */}
                          <Dialog open={!!swishQrData} onOpenChange={(open) => {
                            if (!open) {
                              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                              setSwishQrData(null);
                              setSwishPollStatus(null);
                            }
                          }}>
                            <DialogContent className="max-w-sm text-center">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-center gap-2">
                                  <img src={swishLogo} alt="Swish" className="h-6" />
                                  Swish-betalning
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col items-center gap-4 py-4">
                                {swishPollStatus === "paid" ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <CheckCircle className="w-16 h-16 text-palm" />
                                    <p className="text-lg font-semibold">Betalningen genomförd!</p>
                                    <Button onClick={() => {
                                      setSwishQrData(null);
                                      setSwishPollStatus(null);
                                      window.location.reload();
                                    }} className="bg-gradient-ocean">Stäng</Button>
                                  </div>
                                ) : swishPollStatus === "error" ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <AlertCircle className="w-16 h-16 text-destructive" />
                                    <p className="text-lg font-semibold">Betalningen misslyckades</p>
                                    <p className="text-sm text-muted-foreground">Försök igen eller välj en annan betalningsmetod.</p>
                                    <Button onClick={() => {
                                      setSwishQrData(null);
                                      setSwishPollStatus(null);
                                    }} variant="outline">Stäng</Button>
                                  </div>
                                ) : (
                                  <>
                                    {isMobile ? (
                                      <>
                                        <p className="text-sm text-muted-foreground">
                                          Tryck på knappen nedan för att öppna Swish och slutföra betalningen
                                        </p>
                                        <Button
                                          className="bg-gradient-ocean w-full"
                                          onClick={() => {
                                            if (swishQrData) {
                                              window.location.href = swishQrData.url;
                                            }
                                          }}
                                        >
                                          <img src={swishLogo} alt="Swish" className="h-5 mr-2 brightness-0 invert" />
                                          Öppna Swish
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-sm text-muted-foreground">
                                          Scanna QR-koden med Swish-appen på din telefon
                                        </p>
                                        {swishQrData && (
                                          <div className="bg-white p-4 rounded-xl shadow-md">
                                            <QRCodeSVG
                                              value={swishQrData.url}
                                              size={220}
                                              level="M"
                                              includeMargin
                                            />
                                          </div>
                                        )}
                                      </>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Väntar på betalning...
                                    </div>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

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
