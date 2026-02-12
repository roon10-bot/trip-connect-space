import { useState, useEffect } from "react";
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

const BookTrip = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp } = useAuth();
  
  // Track if user started without an account (persists through the booking flow)
  const [startedWithoutAccount, setStartedWithoutAccount] = useState<boolean | null>(null);
  
  // Set initial state once auth loading is complete
  useEffect(() => {
    if (!authLoading && startedWithoutAccount === null) {
      setStartedWithoutAccount(!user);
    }
  }, [authLoading, user, startedWithoutAccount]);
  
  // Use the persisted state for step calculation
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
  const [travelerInfo, setTravelerInfo] = useState<TravelerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: undefined,
    phone: "",
    departureLocation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

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
    
    // For Splitveckan, calculate price based on group size with 20% margin
    let pricePerPerson = trip.price;
    if (trip.trip_type === "splitveckan" && trip.base_price && travelers > 0) {
      pricePerPerson = Math.ceil((Number(trip.base_price) * 1.20) / travelers);
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

    // Check if code has reached max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      toast.error("Rabattkoden har redan använts maximalt antal gånger");
      return;
    }

    // Check validity dates
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
    const { firstName, lastName, email, birthDate, phone, departureLocation } = travelerInfo;
    
    if (!firstName.trim()) {
      toast.error("Förnamn krävs");
      return false;
    }
    if (!lastName.trim()) {
      toast.error("Efternamn krävs");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Giltig e-postadress krävs");
      return false;
    }
    if (!birthDate) {
      toast.error("Födelsedatum krävs");
      return false;
    }
    if (!phone.trim()) {
      toast.error("Telefonnummer krävs");
      return false;
    }
    if (!departureLocation.trim()) {
      toast.error("Avgångsort krävs");
      return false;
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
      
      // Pre-fill traveler info with account data
      setTravelerInfo((prev) => ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      }));
      
      toast.success("Konto skapat! Fortsätt med bokningen.");
      setCurrentStep(2);
    } catch (error) {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleNextStep = () => {
    // Adjust step validation based on whether we have account step
    const travelerInfoStep = needsAccountStep ? 3 : 2;
    const maxStep = totalSteps;
    
    if (currentStep === travelerInfoStep && !validateStep2()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  };

  const handlePrevStep = () => {
    const minStep = needsAccountStep ? 2 : 1; // Can't go back to account step once created
    setCurrentStep((prev) => Math.max(prev - 1, minStep));
  };

  const handleSubmitBooking = async () => {
    if (!trip || !travelerInfo.birthDate) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const totalPrice = calculateTotalPrice();
      const baseTotal = trip.price * travelers;
      const discountAmount = baseTotal - totalPrice;

      const { error } = await supabase
        .from("trip_bookings")
        .insert({
          trip_id: trip.id,
          user_id: user?.id || null,
          first_name: travelerInfo.firstName,
          last_name: travelerInfo.lastName,
          email: travelerInfo.email,
          birth_date: format(travelerInfo.birthDate, "yyyy-MM-dd"),
          phone: travelerInfo.phone,
          departure_location: travelerInfo.departureLocation,
          travelers: travelers,
          total_price: totalPrice,
          discount_code: appliedDiscount?.code || null,
          discount_amount: discountAmount > 0 ? discountAmount : 0,
          status: "pending",
        });

      if (error) throw error;
      
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
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till sökresultat
        </Link>

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
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Account Creation (only for non-logged in users) */}
              {needsAccountStep && currentStep === 1 && (
                <BookingStepAccount
                  key="step-account"
                  onNext={handleAccountCreation}
                  isLoading={isCreatingAccount}
                />
              )}
              
              {/* Step for travelers count (Step 1 for logged in, Step 2 for new users) */}
              {((needsAccountStep && currentStep === 2) || (!needsAccountStep && currentStep === 1)) && (
                <BookingStep1
                  key="step1"
                  travelers={travelers}
                  setTravelers={setTravelers}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  appliedDiscount={appliedDiscount}
                  applyDiscountCode={applyDiscountCode}
                  removeDiscount={removeDiscount}
                  onNext={handleNextStep}
                />
              )}
              
              {/* Step for traveler info (Step 2 for logged in, Step 3 for new users) */}
              {((needsAccountStep && currentStep === 3) || (!needsAccountStep && currentStep === 2)) && (
                <BookingStep2
                  key="step2"
                  travelerInfo={travelerInfo}
                  setTravelerInfo={setTravelerInfo}
                  onNext={handleNextStep}
                  onPrev={handlePrevStep}
                />
              )}
              
              {/* Step for summary (Step 3 for logged in, Step 4 for new users) */}
              {((needsAccountStep && currentStep === 4) || (!needsAccountStep && currentStep === 3)) && (
                <BookingStep3
                  key="step3"
                  trip={trip}
                  travelers={travelers}
                  travelerInfo={travelerInfo}
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

          {/* Trip Summary Sidebar */}
          <div className="lg:col-span-1">
            <BookingTripSummary
              trip={trip}
              travelers={travelers}
              appliedDiscount={appliedDiscount}
              totalPrice={calculateTotalPrice()}
              formatTripType={formatTripType}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookTrip;
