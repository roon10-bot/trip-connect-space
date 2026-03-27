import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Mail, Lock, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface BookingDetails {
  bookingId: string;
  tripBookingId: string | null;
  tripName: string;
  tripType: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  bookingFee: number;
  email: string;
}

const BookingConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const pendingBookingId = searchParams.get("pending_booking_id");
  const emailParam = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll pending_trip_bookings until completed
  const { data: pendingData } = useQuery({
    queryKey: ["booking-confirmation-poll", pendingBookingId],
    queryFn: async () => {
      if (!pendingBookingId) return null;
      const { data } = await supabase
        .from("pending_trip_bookings")
        .select("status, booking_data, trip_id, total_price, booking_fee_amount, discount_amount, booking_id")
        .eq("id", pendingBookingId)
        .maybeSingle();
      return data;
    },
    enabled: !!pendingBookingId && isPolling,
    refetchInterval: isPolling ? 2000 : false,
  });

  // Load trip details once we have pending data
  const tripId = pendingData?.trip_id;
  const { data: tripData } = useQuery({
    queryKey: ["booking-confirmation-trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const { data } = await supabase
        .from("trips")
        .select("name, trip_type, departure_date, return_date")
        .eq("id", tripId)
        .single();
      return data;
    },
    enabled: !!tripId,
  });

  // Stop polling when completed
  useEffect(() => {
    if (pendingData?.status === "completed" || pendingData?.status === "failed") {
      setIsPolling(false);
    }
  }, [pendingData?.status]);

  // Build booking details once data is available
  useEffect(() => {
    if (!pendingData || !tripData) return;

    const bookingData = pendingData.booking_data as any;
    const primaryEmail = emailParam || bookingData?.travelers_info?.[0]?.email || "";

    const formatTripType = (type: string) => {
      const types: Record<string, string> = {
        seglingsvecka: "Seglingsvecka",
        splitveckan: "Splitveckan",
        studentveckan: "Studentveckan",
      };
      return types[type] || type;
    };

    setBookingDetails({
      bookingId: pendingBookingId || "",
      tripBookingId: (pendingData as any)?.booking_id || null,
      tripName: tripData.name,
      tripType: formatTripType(tripData.trip_type),
      departureDate: tripData.departure_date,
      returnDate: tripData.return_date,
      travelers: bookingData?.travelers || 1,
      bookingFee: pendingData.booking_fee_amount,
      email: primaryEmail,
    });
  }, [pendingData, tripData, emailParam, pendingBookingId]);

  const handleCreateAccount = async () => {
    if (!bookingDetails?.email) return;

    if (password.length < 8) {
      toast.error("Lösenordet måste vara minst 8 tecken");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Lösenorden matchar inte");
      return;
    }

    setIsCreatingAccount(true);
    try {
      const bookingData = pendingData?.booking_data as any;
      const primaryTraveler = bookingData?.travelers_info?.[0];
      const fullName = primaryTraveler
        ? `${primaryTraveler.first_name} ${primaryTraveler.last_name}`
        : "";

      const { data, error } = await supabase.auth.signUp({
        email: bookingDetails.email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          setExistingAccount(true);
          toast.error("Det finns redan ett konto med den här e-postadressen");
        } else if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
          toast.error("För många försök. Vänta en stund och försök igen.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Link the trip booking to the new account if we have a booking_id
        if (bookingDetails.tripBookingId) {
          await supabase
            .from("trip_bookings")
            .update({ user_id: data.user.id })
            .eq("id", bookingDetails.tripBookingId);
        }
        setAccountCreated(true);
        toast.success("Konto skapat! Kolla din e-post för verifiering.");
      }
    } catch (err) {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Still loading / polling
  if (isPolling || !bookingDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h2 className="text-xl font-serif font-semibold">Slutför din bokning...</h2>
            <p className="text-muted-foreground">Vänta medan vi bekräftar din betalning</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment failed
  if (pendingData?.status === "failed" || pendingData?.status === "payment_failed") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-28 pb-16 flex items-center justify-center min-h-[60vh]">
          <Card className="shadow-elegant max-w-md w-full text-center">
            <CardContent className="pt-10 pb-8 px-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <span className="text-4xl">❌</span>
              </div>
              <h2 className="text-2xl font-serif font-bold">Betalningen misslyckades</h2>
              <p className="text-muted-foreground">
                Något gick fel med betalningen. Försök igen.
              </p>
              <Link to="/search">
                <Button size="lg" className="w-full">Tillbaka till sök</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isAlreadyLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-lg mx-auto space-y-8">
          {/* Section 1: Confirmation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="shadow-elegant">
              <CardContent className="pt-10 pb-8 px-8 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-palm/10 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-palm" />
                  </div>
                </motion.div>

                <h2 className="text-3xl font-serif font-bold text-foreground text-center">
                  Betalningen lyckades!
                </h2>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resa</span>
                    <span className="font-medium">
                      {bookingDetails.tripType} • {bookingDetails.tripName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Datum</span>
                    <span className="font-medium">
                      {format(new Date(bookingDetails.departureDate), "d MMM", { locale: sv })} –{" "}
                      {format(new Date(bookingDetails.returnDate), "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Antal resenärer</span>
                    <span className="font-medium">{bookingDetails.travelers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Betalt</span>
                    <span className="font-semibold text-primary">
                      {bookingDetails.bookingFee.toLocaleString("sv-SE")} kr (bokningsavgift)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Mail className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    En bekräftelse har skickats till{" "}
                    <span className="font-medium text-foreground">{bookingDetails.email}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 2: Account Creation (only if not logged in) */}
          {!isAlreadyLoggedIn && !accountCreated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-elegant">
                <CardContent className="pt-8 pb-8 px-8 space-y-5">
                  {existingAccount ? (
                    <>
                      <div className="text-center space-y-2">
                        <LogIn className="w-10 h-10 text-primary mx-auto" />
                        <h3 className="text-xl font-serif font-bold">
                          Du har redan ett konto!
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Logga in för att se din bokning.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link to="/auth" className="flex-1">
                          <Button size="lg" className="w-full bg-gradient-ocean hover:opacity-90">
                            Logga in
                          </Button>
                        </Link>
                        <Link to="/auth?forgot=1" className="flex-1">
                          <Button size="lg" variant="outline" className="w-full">
                            Glömt lösenord
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-primary" />
                          <h3 className="text-xl font-serif font-bold">Skapa ditt konto</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Med ett konto kan du:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Se och hantera dina bokningar</li>
                          <li>• Ladda ner resehandlingar</li>
                          <li>• Följa dina betalningar</li>
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">E-post</Label>
                          <Input
                            id="email"
                            type="email"
                            value={bookingDetails.email}
                            disabled
                            className="bg-muted"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Välj lösenord</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Minst 8 tecken"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ange lösenordet igen"
                          />
                        </div>

                        <Button
                          onClick={handleCreateAccount}
                          size="lg"
                          className="w-full bg-gradient-ocean hover:opacity-90"
                          disabled={isCreatingAccount || !password || !confirmPassword}
                        >
                          {isCreatingAccount ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            "Skapa konto"
                          )}
                        </Button>
                      </div>

                      <div className="text-center text-sm text-muted-foreground">
                        <p>
                          Vill du göra det senare? Du kan alltid skapa ett konto via{" "}
                          <Link to="/auth?forgot=1" className="text-primary hover:underline">
                            "Glömt lösenord"
                          </Link>
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Account created success */}
          {accountCreated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-elegant">
                <CardContent className="pt-8 pb-8 px-8 text-center space-y-4">
                  <CheckCircle className="w-10 h-10 text-palm mx-auto" />
                  <h3 className="text-xl font-serif font-bold">Konto skapat!</h3>
                  <p className="text-sm text-muted-foreground">
                    Vi har skickat ett verifieringsmail till{" "}
                    <span className="font-medium text-foreground">{bookingDetails.email}</span>.
                    Verifiera din e-post och logga in för att se din bokning.
                  </p>
                  <Link to="/auth">
                    <Button size="lg" className="w-full bg-gradient-ocean hover:opacity-90">
                      Gå till inloggning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Already logged in */}
          {isAlreadyLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/dashboard">
                <Button size="lg" className="w-full bg-gradient-ocean hover:opacity-90">
                  Gå till mina bokningar
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Go to homepage link */}
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Hoppa över — Gå till startsidan →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingConfirmation;
