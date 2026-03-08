import { useState, useEffect, useMemo } from "react";
import { getSplitPricePerPerson } from "@/lib/paymentCalculations";
import { useFlightSearch, type FlightOffer } from "@/hooks/useFlightSearch";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { BookingStepIndicator } from "@/components/booking/BookingStepIndicator";
import { BookingStepAccount, AccountFormData } from "@/components/booking/BookingStepAccount";
import { BookingStep1 } from "@/components/booking/BookingStep1";
import { BookingStep2 } from "@/components/booking/BookingStep2";
import { BookingStep3 } from "@/components/booking/BookingStep3";
import { BookingTripSummary } from "@/components/booking/BookingTripSummary";
import { BookingSuccess } from "@/components/booking/BookingSuccess";

export interface TravelerInfo {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date | undefined;
  phone: string;
  departureLocation: string;
}

const createEmptyTraveler = (departureLocation = ""): TravelerInfo => ({
  firstName: "",
  lastName: "",
  email: "",
  birthDate: undefined,
  phone: "",
  departureLocation,
});

const BookTrip = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp } = useAuth();
  
  const [startedWithoutAccount, setStartedWithoutAccount] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (!authLoading && startedWithoutAccount === null) {
      setStartedWithoutAccount(!user);
    }
  }, [authLoading, user, startedWithoutAccount]);
  
  const needsAccountStep = startedWithoutAccount === true;
  const totalSteps = needsAccountStep ? 4 : 3;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [travelers, setTravelers] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number | null;
    amount: number | null;
  } | null>(null);
  const [travelersInfo, setTravelersInfo] = useState<TravelerInfo[]>([createEmptyTraveler()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
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

  // Fetch flight info for the booking page
  const flightSearchParams = departureIATA && trip ? {
    origin: departureIATA,
    destination: "SPU",
    departure_date: trip.departure_date,
    return_date: trip.return_date,
    passengers: travelers,
  } : null;

  const { data: flightData, isLoading: flightLoading } = useFlightSearch(flightSearchParams);
  const cheapestFlight = flightData?.offers?.[0] || null;

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

  const calculateTotalPrice = () => {
    if (!trip) return 0;
    
    let pricePerPerson = trip.price;
    if (trip.trip_type === "splitveckan" && travelers > 0) {
      const splitPrice = getSplitPricePerPerson(trip, travelers);
      if (splitPrice > 0) pricePerPerson = splitPrice;
    }
    
    const baseTotal = pricePerPerson * travelers;
    
    if (appliedDiscount) {
      if (appliedDiscount.percent) {
        return baseTotal - (baseTotal * appliedDiscount.percent / 100);
      }
      if (appliedDiscount.amount) {
        return Math.max(0, baseTotal - appliedDiscount.amount);
      }
    }
    return baseTotal;
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Ange en rabattkod");
      return;
    }

    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Ogiltig rabattkod");
      return;
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast.error("Rabattkoden har redan använts maximalt antal gånger");
      return;
    }

    const now = new Date();
    if (data.valid_from && new Date(data.valid_from) > now) {
      toast.error("Rabattkoden är inte aktiv än");
      return;
    }
    if (data.valid_until && new Date(data.valid_until) < now) {
      toast.error("Rabattkoden har gått ut");
      return;
    }

    setAppliedDiscount({
      code: data.code,
      percent: data.discount_percent,
      amount: data.discount_amount,
    });
    toast.success("Rabattkod tillämpad!");
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const validateStep2 = () => {
    for (let i = 0; i < travelersInfo.length; i++) {
      const t = travelersInfo[i];
      const label = travelersInfo.length > 1 ? ` (Resenär ${i + 1})` : "";
      
      if (!t.firstName.trim()) {
        toast.error(`Förnamn krävs${label}`);
        return false;
      }
      if (!t.lastName.trim()) {
        toast.error(`Efternamn krävs${label}`);
        return false;
      }
      if (!t.email.trim() || !t.email.includes("@")) {
        toast.error(`Giltig e-postadress krävs${label}`);
        return false;
      }
      if (!t.birthDate) {
        toast.error(`Födelsedatum krävs${label}`);
        return false;
      }
      if (!t.phone.trim()) {
        toast.error(`Telefonnummer krävs${label}`);
        return false;
      }
      if (!t.departureLocation.trim()) {
        toast.error(`Avgångsort krävs${label}`);
        return false;
      }
    }
    return true;
  };

  const handleAccountCreation = async (data: AccountFormData) => {
    setIsCreatingAccount(true);
    try {
      const fullName = `${data.firstName} ${data.lastName}`;
      const { error } = await signUp(data.email, data.password, fullName);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("E-postadressen är redan registrerad. Logga in istället.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // Pre-fill first traveler with account data
      setTravelersInfo((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        };
        return updated;
      });
      
      toast.success("Konto skapat! Fortsätt med bokningen.");
      setCurrentStep(2);
    } catch (error) {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleNextStep = () => {
    const travelerInfoStep = needsAccountStep ? 3 : 2;
    const maxStep = totalSteps;
    
    if (currentStep === travelerInfoStep && !validateStep2()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  };

  const handlePrevStep = () => {
    const minStep = needsAccountStep ? 2 : 1;
    setCurrentStep((prev) => Math.max(prev - 1, minStep));
  };

  const handleSubmitBooking = async () => {
    if (!trip || travelersInfo.length === 0) return;
    
    const primaryTraveler = travelersInfo[0];
    if (!primaryTraveler.birthDate) return;
    
    setIsSubmitting(true);
    try {
      const totalPrice = calculateTotalPrice();
      
      let pricePerPerson = trip.price;
      if (trip.trip_type === "splitveckan" && travelers > 0) {
        const splitPrice = getSplitPricePerPerson(trip, travelers);
        if (splitPrice > 0) pricePerPerson = splitPrice;
      }
      const baseTotal = pricePerPerson * travelers;
      const discountAmount = baseTotal - totalPrice;

      // Create booking via edge function (server-side validation)
      const { data: bookingResult, error: fnError } = await supabase.functions.invoke("create-trip-booking", {
        body: {
          trip_id: trip.id,
          travelers,
          total_price: totalPrice,
          discount_code: appliedDiscount?.code || null,
          discount_amount: discountAmount > 0 ? discountAmount : 0,
          travelers_info: travelersInfo.map((t) => ({
            first_name: t.firstName,
            last_name: t.lastName,
            email: t.email,
            birth_date: format(t.birthDate!, "yyyy-MM-dd"),
            phone: t.phone,
            departure_location: t.departureLocation,
          })),
        },
      });

      if (fnError) throw fnError;
      if (bookingResult?.error) throw new Error(bookingResult.error);

      const bookingId = bookingResult.booking_id;

      // Invite all travelers (create accounts + send emails)
      try {
        await supabase.functions.invoke("invite-travelers", {
          body: {
            travelers: travelersInfo.map((t) => ({
              firstName: t.firstName,
              lastName: t.lastName,
              email: t.email,
              phone: t.phone,
            })),
            tripName: trip.name,
            tripType: trip.trip_type,
            departureDate: format(new Date(trip.departure_date), "d MMMM yyyy", { locale: sv }),
            returnDate: format(new Date(trip.return_date), "d MMMM yyyy", { locale: sv }),
            bookingId: bookingId,
            bookerEmail: primaryTraveler.email,
            siteUrl: window.location.origin,
          },
        });
      } catch (inviteError) {
        console.error("Error inviting travelers:", inviteError);
        // Don't block booking completion if invite fails
      }
      
      setBookingComplete(true);
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Något gick fel. Försök igen.");
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
          <h1 className="text-3xl font-serif font-bold mb-4">Resan hittades inte</h1>
          <Link to="/search">
            <Button>Tillbaka till sök</Button>
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
          <h1 className="text-3xl font-serif font-bold mb-4">Fullbokat</h1>
          <p className="text-muted-foreground mb-6">
            Tyvärr är {trip.name} fullbokad. Kolla gärna efter andra tillgängliga resor.
          </p>
          <Link to="/search">
            <Button>Sök efter andra resor</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-28 pb-16">
          <BookingSuccess />
        </main>
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
            Tillbaka till sökresultat
          </Link>
          <Button
            variant="outline"
            onClick={() => navigate("/search")}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            Avbryt bokning
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Boka {trip.name}
          </h1>
          <p className="text-muted-foreground">
            {formatTripType(trip.trip_type)} • {format(new Date(trip.departure_date), "d MMMM", { locale: sv })} - {format(new Date(trip.return_date), "d MMMM yyyy", { locale: sv })}
          </p>
        </div>

        <BookingStepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {needsAccountStep && currentStep === 1 && (
                <BookingStepAccount
                  key="step-account"
                  onNext={handleAccountCreation}
                  isLoading={isCreatingAccount}
                />
              )}
              
              {((needsAccountStep && currentStep === 2) || (!needsAccountStep && currentStep === 1)) && (
                <BookingStep1
                  key="step1"
                  travelers={travelers}
                  setTravelers={setTravelers}
                  maxPersons={trip.max_persons ?? 10}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  appliedDiscount={appliedDiscount}
                  applyDiscountCode={applyDiscountCode}
                  removeDiscount={removeDiscount}
                  onNext={handleNextStep}
                />
              )}
              
              {((needsAccountStep && currentStep === 3) || (!needsAccountStep && currentStep === 2)) && (
                <BookingStep2
                  key="step2"
                  travelersInfo={travelersInfo}
                  setTravelersInfo={setTravelersInfo}
                  onNext={handleNextStep}
                  onPrev={handlePrevStep}
                />
              )}
              
              {((needsAccountStep && currentStep === 4) || (!needsAccountStep && currentStep === 3)) && (
                <BookingStep3
                  key="step3"
                  trip={trip}
                  travelers={travelers}
                  travelersInfo={travelersInfo}
                  appliedDiscount={appliedDiscount}
                  totalPrice={calculateTotalPrice()}
                  formatTripType={formatTripType}
                  onPrev={handlePrevStep}
                  onSubmit={handleSubmitBooking}
                  isSubmitting={isSubmitting}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <BookingTripSummary
              trip={trip}
              travelers={travelers}
              appliedDiscount={appliedDiscount}
              totalPrice={calculateTotalPrice()}
              formatTripType={formatTripType}
              flightOffer={cheapestFlight}
              flightLoading={flightLoading}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookTrip;
