import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getSplitPricePerPerson, calculateSplitPricePerPerson } from "@/lib/paymentCalculations";
import { useFlightSearch, type FlightOffer } from "@/hooks/useFlightSearch";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { z } from "zod";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BookingStepIndicator } from "@/components/booking/BookingStepIndicator";
import { BookingStep1 } from "@/components/booking/BookingStep1";
import { BookingStep2 } from "@/components/booking/BookingStep2";
import { BookingStep3 } from "@/components/booking/BookingStep3";
import { BookingStep4Payment } from "@/components/booking/BookingStep4Payment";
import { BookingTripSummary } from "@/components/booking/BookingTripSummary";

export interface TravelerDiscount {
  codeId: string;
  code: string;
  percent: number | null;
  amount: number | null;
  calculatedAmount: number;
}

export interface TravelerInfo {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date | undefined;
  phone: string;
  departureLocation: string;
  discount?: TravelerDiscount | null;
}

const createEmptyTraveler = (departureLocation = ""): TravelerInfo => ({
  firstName: "",
  lastName: "",
  email: "",
  birthDate: undefined,
  phone: "",
  departureLocation,
  discount: null,
});

const BookTrip = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Receive flight data from search results via router state
  const routerState = location.state as {
    guests?: number;
    flightPricePerPerson?: number | null;
    flightOffer?: FlightOffer | null;
  } | null;
  
  // No account step needed - always 4 steps
  const totalSteps = 4;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [travelers, setTravelers] = useState(routerState?.guests || 1);
  // Per-traveler discount codes (global discount removed)
  const [travelersInfo, setTravelersInfo] = useState<TravelerInfo[]>(
    Array.from({ length: routerState?.guests || 1 }, () => createEmptyTraveler())
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swishResult, setSwishResult] = useState<{
    pendingBookingId: string;
    paymentRequestToken: string;
    swishPaymentId: string;
  } | null>(null);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);

  // Pre-fill first traveler with logged-in user's data
  useEffect(() => {
    if (user && !userProfileLoaded) {
      const loadProfile = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .single();

        const nameParts = (profile?.full_name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setTravelersInfo((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            firstName: updated[0].firstName || firstName,
            lastName: updated[0].lastName || lastName,
            email: user.email || updated[0].email,
            phone: updated[0].phone || profile?.phone || "",
          };
          return updated;
        });
        setUserProfileLoaded(true);
      };
      loadProfile();
    }
  }, [user, userProfileLoaded]);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Extract IATA code from departure_location like "Kastrup (CPH)"
  const departureIATA = useMemo(() => {
    if (!trip?.departure_location) return null;
    const match = trip.departure_location.match(/\(([A-Z]{3})\)/);
    return match?.[1] || null;
  }, [trip?.departure_location]);

  // Only fetch flights if trip uses Duffel and we don't have data from search results
  const tripUsesDuffel = (trip as any)?.use_duffel_flights !== false;
  const hasRouterFlightData = routerState?.flightPricePerPerson != null;
  const travelersChanged = routerState?.guests != null && travelers !== routerState.guests;
  const shouldFetchFlights = tripUsesDuffel && departureIATA && trip && (!hasRouterFlightData || travelersChanged);

  const flightSearchParams = shouldFetchFlights ? {
    origin: departureIATA,
    destination: "SPU",
    departure_date: trip.departure_date,
    return_date: trip.return_date,
    passengers: travelers,
  } : null;

  const { data: flightData, isLoading: flightLoading } = useFlightSearch(flightSearchParams);
  
  // Use router state flight data as default, override with fresh data if fetched
  const cheapestFlight = tripUsesDuffel
    ? (flightData?.offers?.[0] || (hasRouterFlightData && !travelersChanged ? routerState?.flightOffer : null) || null)
    : null;
  const dynamicFlightPricePerPerson = tripUsesDuffel
    ? (flightData?.offers?.[0]
      ? parseFloat(flightData.offers[0].price_per_passenger_sek)
      : (hasRouterFlightData && !travelersChanged ? routerState.flightPricePerPerson : null))
    : null;

  // Sync travelersInfo array length with travelers count and set departure location from trip
  useEffect(() => {
    const depLoc = trip?.departure_location || "";
    setTravelersInfo((prev) => {
      let updated = prev.map((t) => ({ ...t, departureLocation: depLoc }));
      if (updated.length === travelers) return updated;
      if (updated.length < travelers) {
        return [...updated, ...Array.from({ length: travelers - updated.length }, () => createEmptyTraveler(depLoc))];
      }
      return updated.slice(0, travelers);
    });
  }, [travelers, trip?.departure_location]);

  const formatTripType = (type: string) => {
    const types: Record<string, string> = {
      seglingsvecka: "Seglingsvecka",
      splitveckan: "Splitveckan",
      studentveckan: "Studentveckan",
    };
    return types[type] || type;
  };

  const getPricePerPerson = () => {
    if (!trip) return 0;
    let pricePerPerson = trip.price;

    if (trip.trip_type === "splitveckan" && travelers > 0) {
      if (dynamicFlightPricePerPerson !== null) {
        const accommodation = Number(trip.base_price_accommodation) || 0;
        const extras = Number(trip.base_price_extras) || 0;
        const dynamicPrice = calculateSplitPricePerPerson(accommodation, dynamicFlightPricePerPerson ?? 0, extras, travelers);
        if (dynamicPrice > 0) pricePerPerson = dynamicPrice;
      } else {
        const splitPrice = getSplitPricePerPerson(trip, travelers);
        if (splitPrice > 0) pricePerPerson = splitPrice;
      }
    } else if (dynamicFlightPricePerPerson !== null) {
      const accommodation = Number(trip.base_price_accommodation) || 0;
      const extras = Number(trip.base_price_extras) || 0;
      const dynamicPrice = Math.ceil((accommodation * 1.20) + (dynamicFlightPricePerPerson ?? 0) + extras);
      if (dynamicPrice > 0) pricePerPerson = dynamicPrice;
    }

    return pricePerPerson;
  };

  const getTotalDiscount = () => {
    return travelersInfo.reduce((sum, t) => sum + (t.discount?.calculatedAmount || 0), 0);
  };

  const calculateTotalPrice = () => {
    if (!trip) return 0;
    const pricePerPerson = getPricePerPerson();
    const baseTotal = pricePerPerson * travelers;
    const totalDiscount = getTotalDiscount();
    return Math.max(0, baseTotal - totalDiscount);
  };

  // Per-traveler discount validation is handled in BookingStep2

  const validateStep2 = () => {
    for (let i = 0; i < travelersInfo.length; i++) {
      const ti = travelersInfo[i];
      const label = travelersInfo.length > 1 ? ` (${t("bookTrip.travelerLabel", { num: i + 1 })})` : "";
      
      if (!ti.firstName.trim()) {
        toast.error(`${t("bookTrip.firstNameRequired")}${label}`);
        return false;
      }
      if (!ti.lastName.trim()) {
        toast.error(`${t("bookTrip.lastNameRequired")}${label}`);
        return false;
      }
      if (!ti.email.trim() || !z.string().email().safeParse(ti.email.trim()).success) {
        toast.error(`${t("bookTrip.emailRequired")}${label}`);
        return false;
      }
      if (!ti.birthDate) {
        toast.error(`${t("bookTrip.birthDateRequired")}${label}`);
        return false;
      }
      if (!ti.phone.trim()) {
        toast.error(`${t("bookTrip.phoneRequired")}${label}`);
        return false;
      }
      if (!ti.departureLocation.trim()) {
        toast.error(`${t("bookTrip.departureRequired")}${label}`);
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const mapPaymentError = (message: string) => {
    if (message.includes("No authorization header provided") || message.includes("User not authenticated")) {
      return "Du behöver vara inloggad för att betala. Har du redan ett konto? Logga in först.";
    }
    if (message.includes("Turnstile verification failed")) {
      return "Säkerhetsverifieringen misslyckades. Ladda om sidan och försök igen.";
    }
    if (message.includes("Trip not found") || message.includes("Trip is not active") || message.includes("Trip is fully booked")) {
      return "Resan är inte längre tillgänglig. Uppdatera sidan och försök igen.";
    }
    return message || t("bookTrip.somethingWentWrong");
  };

  const handlePayBookingFee = async (method: "card" | "swish", turnstileToken: string) => {
    if (!trip || travelersInfo.length === 0 || !turnstileToken) return;

    if (!user?.id) {
      toast.error(t("bookTrip.paymentRequiresLogin"));
      navigate(`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }

    const primaryTraveler = travelersInfo[0];
    if (!primaryTraveler.birthDate) return;

    setIsSubmitting(true);
    try {
      const totalPrice = calculateTotalPrice();

      const pricePerPerson = getPricePerPerson();
      const baseTotal = pricePerPerson * travelers;
      const discountAmount = baseTotal - totalPrice;

      // Initiate payment via edge function (creates pending booking + payment)
      const { data: result, error: fnError } = await supabase.functions.invoke("initiate-trip-payment", {
        body: {
          trip_id: trip.id,
          travelers,
          total_price: totalPrice,
          discount_code: null,
          discount_amount: discountAmount > 0 ? discountAmount : 0,
          travelers_info: travelersInfo.map((t) => ({
            first_name: t.firstName,
            last_name: t.lastName,
            email: t.email,
            birth_date: format(t.birthDate!, "yyyy-MM-dd"),
            phone: t.phone,
            departure_location: t.departureLocation,
            discount_code_id: t.discount?.codeId || null,
            discount_amount: t.discount?.calculatedAmount || 0,
          })),
          payment_method: method,
          turnstile_token: turnstileToken,
        },
      });

      if (fnError) {
        let detailedError = fnError.message || "Payment initialization failed";
        const fnContext = (fnError as { context?: Response }).context;

        if (fnContext && typeof fnContext.json === "function") {
          try {
            const errBody = await fnContext.json();
            if (errBody?.error && typeof errBody.error === "string") {
              detailedError = errBody.error;
            }
          } catch {
            // no-op: fallback to fnError.message
          }
        }

        throw new Error(detailedError);
      }

      if (result?.error) throw new Error(result.error);

      if (method === "card" && result?.payment_url) {
        // Redirect to AltaPay payment page
        window.location.href = result.payment_url;
      } else if (method === "swish" && result?.pending_booking_id) {
        // Show Swish QR/polling UI in step 4
        setSwishResult({
          pendingBookingId: result.pending_booking_id,
          paymentRequestToken: result.payment_request_token || "",
          swishPaymentId: result.swish_payment_id || "",
        });
      }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      console.error("Payment error:", error);
      toast.error(mapPaymentError(rawMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-[400px] rounded-xl" />
            </div>
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">{t("bookTrip.tripNotFound")}</h1>
          <Link to="/search">
            <Button>{t("bookTrip.backToSearchBtn")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (trip.is_fullbooked) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">{t("bookTrip.fullbooked")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("bookTrip.fullbookedDesc", { name: trip.name })}
          </p>
          <Link to="/search">
            <Button>{t("bookTrip.searchOther")}</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("bookTrip.backToSearch")}
          </Link>
          <Button
            variant="outline"
            onClick={() => navigate("/search")}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {t("bookTrip.cancelBooking")}
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            {t("bookTrip.book", { name: trip.name })}
          </h1>
          <p className="text-muted-foreground">
            {formatTripType(trip.trip_type)} • {format(new Date(trip.departure_date), "d MMMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMMM yyyy", { locale: sv })}
          </p>
        </div>

        <BookingStepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <BookingStep1
                  key="step1"
                  travelers={travelers}
                  setTravelers={setTravelers}
                  maxPersons={trip.max_persons ?? 10}
                  onNext={handleNextStep}
                />
              )}
              
              {currentStep === 2 && (
                <BookingStep2
                  key="step2"
                  travelersInfo={travelersInfo}
                  setTravelersInfo={setTravelersInfo}
                  pricePerPerson={getPricePerPerson()}
                  onNext={handleNextStep}
                  onPrev={handlePrevStep}
                />
              )}
              
              {currentStep === 3 && (
                <BookingStep3
                  key="step3"
                  trip={trip}
                  travelers={travelers}
                  travelersInfo={travelersInfo}
                  totalPrice={calculateTotalPrice()}
                  formatTripType={formatTripType}
                  onPrev={handlePrevStep}
                  onSubmit={() => handleNextStep()}
                  isSubmitting={false}
                />
              )}

              {currentStep === 4 && (
                <BookingStep4Payment
                  key="step4"
                  bookingFee={Math.ceil(calculateTotalPrice() * 0.40)}
                  totalPrice={calculateTotalPrice()}
                  tripName={trip.name}
                  onPrev={handlePrevStep}
                  onPay={handlePayBookingFee}
                  isProcessing={isSubmitting}
                  swishResult={swishResult}
                  primaryEmail={travelersInfo[0]?.email}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <BookingTripSummary
              trip={trip}
              travelers={travelers}
              travelersInfo={travelersInfo}
              totalPrice={calculateTotalPrice()}
              formatTripType={formatTripType}
              flightOffer={cheapestFlight}
              flightLoading={flightLoading}
              dynamicFlightPricePerPerson={dynamicFlightPricePerPerson}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookTrip;
