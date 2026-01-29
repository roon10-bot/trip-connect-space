import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, differenceInDays, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Star,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  Loader2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  guests: z.number().min(1, "Minst 1 gäst").max(10, "Max 10 gäster"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const Book = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 7));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 14));
  const [isBooking, setIsBooking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guests: 2,
    },
  });

  const guests = watch("guests");

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info("Logga in för att boka");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: destination, isLoading } = useQuery({
    queryKey: ["destination", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const basePrice = destination?.price_from ? Number(destination.price_from) : 0;
  const totalPrice = basePrice * nights * (guests || 1);

  const onSubmit = async () => {
    if (!user || !checkIn || !checkOut || !destination) return;

    setIsBooking(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        destination_id: destination.id,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests: guests,
        total_price: totalPrice,
        status: "confirmed",
      });

      if (error) throw error;

      toast.success("Bokning bekräftad! 🎉");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Destinationen hittades inte</h1>
          <Link to="/destinations">
            <Button>Tillbaka till destinationer</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-16">
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till destinationer
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Destination Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative rounded-2xl overflow-hidden mb-6">
              <img
                src={destination.image_url || ""}
                alt={destination.name}
                className="w-full h-[400px] object-cover"
              />
              {destination.featured && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-sunset text-accent-foreground text-sm font-semibold">
                    Populär
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm">
                <Star className="w-4 h-4 text-sunset fill-sunset" />
                <span className="text-sm font-semibold">{destination.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="w-5 h-5 text-ocean" />
              <span className="text-lg">{destination.country}</span>
            </div>

            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
              {destination.name}
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed">
              {destination.description}
            </p>
          </motion.div>

          {/* Booking Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="shadow-elegant sticky top-28">
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Boka din resa</CardTitle>
                <CardDescription>
                  Fyll i uppgifterna nedan för att slutföra din bokning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Check-in Date */}
                  <div className="space-y-2">
                    <Label>Incheckning</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "PPP", { locale: sv }) : "Välj datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Check-out Date */}
                  <div className="space-y-2">
                    <Label>Utcheckning</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "PPP", { locale: sv }) : "Välj datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(date) => !checkIn || date <= checkIn}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guests */}
                  <div className="space-y-2">
                    <Label htmlFor="guests">Antal gäster</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => guests > 1 && setValue("guests", guests - 1)}
                        disabled={guests <= 1}
                      >
                        -
                      </Button>
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Users className="w-5 h-5 text-ocean" />
                        {guests}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => guests < 10 && setValue("guests", guests + 1)}
                        disabled={guests >= 10}
                      >
                        +
                      </Button>
                    </div>
                    {errors.guests && (
                      <p className="text-sm text-destructive">{errors.guests.message}</p>
                    )}
                  </div>

                  {/* Price Summary */}
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        {basePrice.toLocaleString("sv-SE")} kr x {nights} nätter
                      </span>
                      <span>{(basePrice * nights).toLocaleString("sv-SE")} kr</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Antal gäster</span>
                      <span>x {guests}</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Totalt</span>
                        <span className="text-2xl font-bold text-primary">
                          {totalPrice.toLocaleString("sv-SE")} kr
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 bg-gradient-ocean hover:opacity-90 text-lg font-semibold"
                    disabled={isBooking || !checkIn || !checkOut || nights <= 0}
                  >
                    {isBooking ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Bekräfta bokning
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Book;
