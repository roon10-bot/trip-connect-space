import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Upload, X, Image } from "lucide-react";
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

const departureLocations = [
  { value: "Kastrup (CPH)", label: "Kastrup (CPH)" },
  { value: "Landvetter (GOT)", label: "Landvetter (GOT)" },
  { value: "Arlanda (ARN)", label: "Arlanda (ARN)" },
];

const paymentValueTypes = ["percent", "amount"] as const;

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
  first_payment_type: z.enum(paymentValueTypes),
  first_payment_date: z.date().optional().nullable(),
  second_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  second_payment_type: z.enum(paymentValueTypes),
  second_payment_date: z.date().optional().nullable(),
  final_payment_amount: z.coerce.number().min(0, "Belopp måste vara 0 eller mer"),
  final_payment_type: z.enum(paymentValueTypes),
  final_payment_date: z.date().optional().nullable(),
}).refine((data) => data.return_date > data.departure_date, {
  message: "Hemresedatum måste vara efter avgångsdatum",
  path: ["return_date"],
}).refine((data) => data.max_persons >= data.min_persons, {
  message: "Max personer måste vara större eller lika med min personer",
  path: ["max_persons"],
});

type TripFormValues = z.infer<typeof tripSchema>;

interface CreateTripFormProps {
  onSuccess?: () => void;
}

export const CreateTripForm = ({ onSuccess }: CreateTripFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      first_payment_type: "amount",
      second_payment_amount: 0,
      second_payment_type: "amount",
      final_payment_amount: 0,
      final_payment_type: "amount",
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const picked = Array.from(files);
    const accepted: File[] = [];
    const previewPromises: Promise<string>[] = [];

    picked.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} är för stor (max 5 MB)`);
        return;
      }

      accepted.push(file);
      previewPromises.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Kunde inte läsa filen"));
          reader.readAsDataURL(file);
        })
      );
    });

    if (accepted.length === 0) return;

    const previews = await Promise.all(previewPromises);

    // Lägg till i befintlig lista så man kan välja i omgångar
    setImageFiles((prev) => [...prev, ...accepted]);
    setImagePreviews((prev) => [...prev, ...previews]);

    // Allow re-selecting the same files later
    e.target.value = "";
  };

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  const uploadTripImages = async (
    tripId: string,
    files: File[]
  ): Promise<string | null> => {
    if (!files.length) return null;

    let firstPublicUrl: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        // Double check, should already be filtered client-side
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${tripId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("trip-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-images").getPublicUrl(fileName);

      if (!firstPublicUrl) firstPublicUrl = publicUrl;

      const { error: insertError } = await supabase.from("trip_images").insert({
        trip_id: tripId,
        image_url: publicUrl,
        display_order: i,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    return firstPublicUrl;
  };

  const createTripMutation = useMutation({
    mutationFn: async (values: TripFormValues) => {
      if (!user?.id) throw new Error("Du måste vara inloggad");
      setIsUploading(true);

      // First create the trip to get the ID
      const { data: tripData, error: tripError } = await supabase.from("trips").insert({
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
        first_payment_type: values.first_payment_type,
        first_payment_date: values.first_payment_date ? format(values.first_payment_date, "yyyy-MM-dd") : null,
        second_payment_amount: values.second_payment_amount,
        second_payment_type: values.second_payment_type,
        second_payment_date: values.second_payment_date ? format(values.second_payment_date, "yyyy-MM-dd") : null,
        final_payment_amount: values.final_payment_amount,
        final_payment_type: values.final_payment_type,
        final_payment_date: values.final_payment_date ? format(values.final_payment_date, "yyyy-MM-dd") : null,
        created_by: user.id,
      }).select('id').single();

      if (tripError) throw tripError;

      // Then upload images (max 5MB per image)
      if (imageFiles.length > 0 && tripData) {
        const firstImageUrl = await uploadTripImages(tripData.id, imageFiles);
        if (firstImageUrl) {
          const { error: updateError } = await supabase
            .from("trips")
            .update({ image_url: firstImageUrl })
            .eq("id", tripData.id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success("Resa skapad!");
      form.reset();
      clearImages();
      onSuccess?.();
    },
    onError: (error) => {
      setIsUploading(false);
      console.error("Error creating trip:", error);
      toast.error("Kunde inte skapa resan");
    },
  });

  const onSubmit = (values: TripFormValues) => {
    createTripMutation.mutate(values);
  };

  const firstPaymentAmount = Number(form.watch("first_payment_amount") || 0);
  const secondPaymentAmount = Number(form.watch("second_payment_amount") || 0);
  const finalPaymentAmount = Number(form.watch("final_payment_amount") || 0);
  const firstPaymentType = form.watch("first_payment_type");
  const secondPaymentType = form.watch("second_payment_type");
  const finalPaymentType = form.watch("final_payment_type");

  const allPercent = 
    firstPaymentType === "percent" && 
    secondPaymentType === "percent" && 
    finalPaymentType === "percent";

  const totalPaymentPlan = firstPaymentAmount + secondPaymentAmount + finalPaymentAmount;
  const paymentPlanUnit = allPercent ? "%" : "kr";

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
                      <FormDescription>Antal platser totalt</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="min_persons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min personer/boende</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>Minsta antal per lägenhet</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_persons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max personer/boende</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>Högsta antal per lägenhet</FormDescription>
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
                      <FormDescription>Inköpspris för lägenheten (20% marginal adderas)</FormDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj avgångsort" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departureLocations.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>
                              {loc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <FormLabel>Resebild</FormLabel>
                <FormDescription>
                  Ladda upp en eller flera bilder som visas för kunder (max 5 MB per bild)
                </FormDescription>

                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {imagePreviews.length > 0 ? "Lägg till fler" : "Välj bilder"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Image className="h-4 w-4" />
                    <span className="text-sm">JPG, PNG, WEBP</span>
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Valda bilder: {imagePreviews.length}
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={clearImages}>
                        Rensa
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={`${idx}-${src.slice(0, 16)}`} className="relative group">
                          <img
                            src={src}
                            alt={`Förhandsvisning resebild ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border"
                            loading="lazy"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImageAt(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Betalningsplan</h3>
                <div className="text-sm text-muted-foreground">
                  Totalt: <span className="font-semibold text-foreground">{totalPaymentPlan.toLocaleString("sv-SE")} {paymentPlanUnit}</span>
                </div>
              </div>

              {/* First Payment */}
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="first_payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Första betalningen</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="first_payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj typ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percent">Procent (%)</SelectItem>
                          <SelectItem value="amount">Kronor (kr)</SelectItem>
                        </SelectContent>
                      </Select>
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
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="second_payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Andra betalningen</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="second_payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj typ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percent">Procent (%)</SelectItem>
                          <SelectItem value="amount">Kronor (kr)</SelectItem>
                        </SelectContent>
                      </Select>
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
              <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="final_payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sista betalningen</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="final_payment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj typ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percent">Procent (%)</SelectItem>
                          <SelectItem value="amount">Kronor (kr)</SelectItem>
                        </SelectContent>
                      </Select>
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
              disabled={createTripMutation.isPending || isUploading}
            >
              {createTripMutation.isPending || isUploading ? "Skapar..." : "Skapa resa"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
