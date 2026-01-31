import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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

const tripSchema = z.object({
  trip_type: z.enum(["seglingsvecka", "splitveckan", "studentveckan"], {
    required_error: "Välj en restyp",
  }),
  name: z.string().min(2, "Namn måste vara minst 2 tecken").max(100, "Namn får max vara 100 tecken"),
  capacity: z.coerce.number().min(1, "Kapacitet måste vara minst 1").max(500, "Kapacitet får max vara 500"),
  departure_date: z.date({ required_error: "Välj avgångsdatum" }),
  return_date: z.date({ required_error: "Välj hemresedatum" }),
  description: z.string().max(2000, "Beskrivning får max vara 2000 tecken").optional(),
  departure_location: z.string().min(2, "Avgångsort måste vara minst 2 tecken").max(100, "Avgångsort får max vara 100 tecken"),
  first_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  first_payment_date: z.date().optional().nullable(),
  second_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  second_payment_date: z.date().optional().nullable(),
  final_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  final_payment_date: z.date().optional().nullable(),
}).refine((data) => data.return_date > data.departure_date, {
  message: "Hemresedatum måste vara efter avgångsdatum",
  path: ["return_date"],
});

type TripFormValues = z.infer<typeof tripSchema>;

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export const CreateTripForm = ({ onSuccess }: CreateTripFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      trip_type: undefined,
      name: "",
      capacity: 20,
      description: "",
      departure_location: "",
      first_payment_amount: 0,
      second_payment_amount: 0,
      final_payment_amount: 0,
    },
  });

  const createTripMutation = useMutation({
    mutationFn: async (values: TripFormValues) => {
      if (!user?.id) throw new Error("Du måste vara inloggad");

      const { error } = await supabase.from("trips").insert({
        trip_type: values.trip_type,
        name: values.name,
        capacity: values.capacity,
        departure_date: format(values.departure_date, "yyyy-MM-dd"),
        return_date: format(values.return_date, "yyyy-MM-dd"),
        description: values.description || null,
        departure_location: values.departure_location,
        first_payment_amount: values.first_payment_amount,
        first_payment_date: values.first_payment_date ? format(values.first_payment_date, "yyyy-MM-dd") : null,
        second_payment_amount: values.second_payment_amount,
        second_payment_date: values.second_payment_date ? format(values.second_payment_date, "yyyy-MM-dd") : null,
        final_payment_amount: values.final_payment_amount,
        final_payment_date: values.final_payment_date ? format(values.final_payment_date, "yyyy-MM-dd") : null,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success("Resa skapad!");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating trip:", error);
      toast.error("Kunde inte skapa resan");
    },
  });

  const onSubmit = (values: TripFormValues) => {
    createTripMutation.mutate(values);
  };

  const totalPrice =
    (form.watch("first_payment_amount") || 0) +
    (form.watch("second_payment_amount") || 0) +
    (form.watch("final_payment_amount") || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Skapa en resa</CardTitle>
        <CardDescription>
          Fyll i informationen nedan för att skapa en ny resa som blir synlig för kunder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapacitet</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>Antal platser tillgängliga</FormDescription>
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
                            disabled={(date) => date < new Date()}
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
                            disabled={(date) => date < new Date()}
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beskrivning</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Beskriv resan..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              disabled={createTripMutation.isPending}
            >
              {createTripMutation.isPending ? "Skapar..." : "Skapa resa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
