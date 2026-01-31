import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TripImageUploader } from "./TripImageUploader";

const tripSchema = z.object({
  trip_type: z.enum(["seglingsvecka", "splitveckan", "studentveckan"], {
    required_error: "Välj en restyp",
  }),
  name: z.string().min(2, "Namn måste vara minst 2 tecken").max(100, "Namn får max vara 100 tecken"),
  capacity: z.coerce.number().min(1, "Kapacitet måste vara minst 1").max(500, "Kapacitet får max vara 500"),
  min_persons: z.coerce.number().min(1, "Minst 1 person"),
  max_persons: z.coerce.number().min(1, "Minst 1 person"),
  base_price: z.coerce.number().min(0, "Baspris måste vara 0 eller mer"),
  departure_date: z.date({ required_error: "Välj avgångsdatum" }),
  return_date: z.date({ required_error: "Välj hemresedatum" }),
  description: z.string().max(2000, "Beskrivning får max vara 2000 tecken").optional(),
  departure_location: z.string().min(2, "Avgångsort måste vara minst 2 tecken").max(100, "Avgångsort får max vara 100 tecken"),
  price: z.coerce.number().min(0, "Pris måste vara 0 eller mer"),
  first_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  first_payment_date: z.date().optional().nullable(),
  second_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  second_payment_date: z.date().optional().nullable(),
  final_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  final_payment_date: z.date().optional().nullable(),
}).refine((data) => data.return_date > data.departure_date, {
  message: "Hemresedatum måste vara efter avgångsdatum",
  path: ["return_date"],
}).refine((data) => data.max_persons >= data.min_persons, {
  message: "Max personer måste vara större eller lika med min personer",
  path: ["max_persons"],
});

type TripFormValues = z.infer<typeof tripSchema>;

interface EditTripDialogProps {
  tripId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTripDialog = ({ tripId, open, onOpenChange }: EditTripDialogProps) => {
  const queryClient = useQueryClient();

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tripId && open,
  });

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      trip_type: undefined,
      name: "",
      capacity: 20,
      min_persons: 1,
      max_persons: 8,
      base_price: 0,
      description: "",
      departure_location: "",
      price: 0,
      first_payment_amount: 0,
      second_payment_amount: 0,
      final_payment_amount: 0,
    },
  });

  useEffect(() => {
    if (trip) {
      form.reset({
        trip_type: trip.trip_type as "seglingsvecka" | "splitveckan" | "studentveckan",
        name: trip.name,
        capacity: trip.capacity,
        min_persons: trip.min_persons || 1,
        max_persons: trip.max_persons || 8,
        base_price: Number(trip.base_price) || 0,
        departure_date: new Date(trip.departure_date),
        return_date: new Date(trip.return_date),
        description: trip.description || "",
        departure_location: trip.departure_location,
        price: Number(trip.price),
        first_payment_amount: Number(trip.first_payment_amount),
        first_payment_date: trip.first_payment_date ? new Date(trip.first_payment_date) : null,
        second_payment_amount: Number(trip.second_payment_amount),
        second_payment_date: trip.second_payment_date ? new Date(trip.second_payment_date) : null,
        final_payment_amount: Number(trip.final_payment_amount),
        final_payment_date: trip.final_payment_date ? new Date(trip.final_payment_date) : null,
      });
    }
  }, [trip, form]);

  const updateTripMutation = useMutation({
    mutationFn: async (values: TripFormValues) => {
      if (!tripId) throw new Error("Trip ID saknas");

      const { error } = await supabase
        .from("trips")
        .update({
          trip_type: values.trip_type,
          name: values.name,
          capacity: values.capacity,
          min_persons: values.min_persons,
          max_persons: values.max_persons,
          base_price: values.base_price,
          departure_date: format(values.departure_date, "yyyy-MM-dd"),
          return_date: format(values.return_date, "yyyy-MM-dd"),
          description: values.description || null,
          departure_location: values.departure_location,
          price: values.price,
          first_payment_amount: values.first_payment_amount,
          first_payment_date: values.first_payment_date ? format(values.first_payment_date, "yyyy-MM-dd") : null,
          second_payment_amount: values.second_payment_amount,
          second_payment_date: values.second_payment_date ? format(values.second_payment_date, "yyyy-MM-dd") : null,
          final_payment_amount: values.final_payment_amount,
          final_payment_date: values.final_payment_date ? format(values.final_payment_date, "yyyy-MM-dd") : null,
        })
        .eq("id", tripId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Resa uppdaterad! Ändringar visas nu för kunderna.");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error updating trip:", error);
      toast.error("Kunde inte uppdatera resan");
    },
  });

  const onSubmit = (values: TripFormValues) => {
    updateTripMutation.mutate(values);
  };

  const totalPrice =
    Number(form.watch("first_payment_amount") || 0) +
    Number(form.watch("second_payment_amount") || 0) +
    Number(form.watch("final_payment_amount") || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">Redigera resa</DialogTitle>
          <DialogDescription>
            Uppdatera resans information. Ändringar sparas automatiskt hos kunderna.
          </DialogDescription>
        </DialogHeader>

        {tripLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Grundinformation</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trip_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Typ av resa</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj restyp" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="seglingsvecka">Seglingsveckan</SelectItem>
                              <SelectItem value="splitveckan">Splitveckan</SelectItem>
                              <SelectItem value="studentveckan">Studentveckan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Namn på resa</FormLabel>
                          <FormControl>
                            <Input placeholder="t.ex. Seglingsveckan Juni 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total kapacitet</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormDescription>Platser totalt</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="min_persons"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min pers/boende</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormDescription>Minsta antal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_persons"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max pers/boende</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormDescription>Högsta antal</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="base_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Baspris för boende (kr)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="t.ex. 15000" {...field} />
                          </FormControl>
                          <FormDescription>Inköpspris (20% marginal adderas)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="departure_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avgångsort</FormLabel>
                          <FormControl>
                            <Input placeholder="t.ex. Stockholm" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departure_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Avgångsdatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: sv })
                                  ) : (
                                    <span>Välj datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="return_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Hemresedatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: sv })
                                  ) : (
                                    <span>Välj datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pris för resan (kr)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} placeholder="t.ex. 9990" {...field} />
                          </FormControl>
                          <FormDescription>Totalpriset som visas för kunden</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Dynamic pricing preview for Splitveckan */}
                  {form.watch("trip_type") === "splitveckan" && Number(form.watch("base_price")) > 0 && (
                    <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sm">Prisberäkning per person (Splitveckan)</h4>
                      <p className="text-xs text-muted-foreground">
                        Baspris med 20% marginal, delat på antal personer i lägenheten
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Array.from(
                          { length: Number(form.watch("max_persons") || 8) - Number(form.watch("min_persons") || 1) + 1 },
                          (_, i) => Number(form.watch("min_persons") || 1) + i
                        ).map((persons) => {
                          const basePrice = Number(form.watch("base_price")) || 0;
                          const priceWithMargin = basePrice * 1.20; // 20% margin
                          const pricePerPerson = Math.ceil(priceWithMargin / persons);
                          return (
                            <div key={persons} className="bg-background rounded p-2 text-center">
                              <div className="text-xs text-muted-foreground">{persons} pers</div>
                              <div className="font-semibold text-sm">{pricePerPerson.toLocaleString("sv-SE")} kr</div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total med marginal: {Math.ceil(Number(form.watch("base_price") || 0) * 1.20).toLocaleString("sv-SE")} kr
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beskrivning</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Beskriv resan..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Trip Images Section */}
                {tripId && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Resebilder</h3>
                    <TripImageUploader tripId={tripId} />
                  </div>
                )}

                {/* Payment Schedule Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Betalningsplan</h3>
                    <div className="text-sm text-muted-foreground">
                      Totalt: <span className="font-semibold text-foreground">{totalPrice.toLocaleString("sv-SE")} kr</span>
                    </div>
                  </div>

                  {/* First Payment */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="first_payment_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Första betalningen (kr)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="first_payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Förfallodatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: sv })
                                  ) : (
                                    <span>Välj datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Second Payment */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="second_payment_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Andra betalningen (kr)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="second_payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Förfallodatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: sv })
                                  ) : (
                                    <span>Välj datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Final Payment */}
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="final_payment_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sista betalningen (kr)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="final_payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Förfallodatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: sv })
                                  ) : (
                                    <span>Välj datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={updateTripMutation.isPending}
                >
                  {updateTripMutation.isPending ? "Sparar..." : "Spara ändringar"}
                </Button>
              </form>
            </Form>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
