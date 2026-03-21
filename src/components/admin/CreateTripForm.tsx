import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Upload, X, Image, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { calculateSplitPricePerPerson } from "@/lib/paymentCalculations";

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
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  const [accommodationRooms, setAccommodationRooms] = useState<string>("");
  const [accommodationSizeSqm, setAccommodationSizeSqm] = useState<string>("");
  const [accommodationFacilities, setAccommodationFacilities] = useState<string>("");
  const [accommodationAddress, setAccommodationAddress] = useState<string>("");
  const [accommodationDescription, setAccommodationDescription] = useState<string>("");
  const [useManualPaymentPlan, setUseManualPaymentPlan] = useState(false);
  const [useDuffelFlights, setUseDuffelFlights] = useState(true);
  const [basePriceAccommodation, setBasePriceAccommodation] = useState<string>("0");
  
  const [basePriceExtras, setBasePriceExtras] = useState<string>("0");
  const [templateImageUrls, setTemplateImageUrls] = useState<string[]>([]);
  const [templateMainImageUrl, setTemplateMainImageUrl] = useState<string | null>(null);

  // Fetch templates for quick-fill
  const { data: templates } = useQuery({
    queryKey: ["trip-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_templates" as any)
        .select("*")
        .order("trip_type")
        .order("template_name");
      if (error) throw error;
      return data as any[];
    },
  });

  const applyTemplate = (templateId: string) => {
    const tpl = templates?.find((t: any) => t.id === templateId);
    if (!tpl) return;
    // Grundinfo
    if (tpl.trip_type) form.setValue("trip_type", tpl.trip_type);
    if (tpl.name) form.setValue("name", tpl.name);
    if (tpl.capacity != null) form.setValue("capacity", Number(tpl.capacity));
    if (tpl.min_persons != null) form.setValue("min_persons", Number(tpl.min_persons));
    if (tpl.max_persons != null) form.setValue("max_persons", Number(tpl.max_persons));
    // Accommodation
    if (tpl.accommodation_rooms != null) setAccommodationRooms(String(tpl.accommodation_rooms));
    if (tpl.accommodation_size_sqm != null) setAccommodationSizeSqm(String(tpl.accommodation_size_sqm));
    if (tpl.accommodation_address) setAccommodationAddress(tpl.accommodation_address);
    if (tpl.accommodation_description) setAccommodationDescription(tpl.accommodation_description);
    if (tpl.accommodation_facilities) setAccommodationFacilities(Array.isArray(tpl.accommodation_facilities) ? tpl.accommodation_facilities.join(", ") : "");
    // Pricing from template
    if (tpl.base_price_accommodation != null) setBasePriceAccommodation(String(tpl.base_price_accommodation));
    
    if (tpl.base_price_extras != null) setBasePriceExtras(String(tpl.base_price_extras));
    if (tpl.base_price != null) form.setValue("base_price", Number(tpl.base_price));
    if (tpl.price != null) form.setValue("price", Number(tpl.price));
    // Images from template
    const galleryUrls = tpl.image_urls?.length ? tpl.image_urls : (tpl.image_url ? [tpl.image_url] : []);
    const mainUrl = tpl.image_url || galleryUrls[0] || null;
    const orderedUrls = mainUrl ? [mainUrl, ...galleryUrls.filter((url: string) => url !== mainUrl)] : galleryUrls;

    if (orderedUrls.length > 0) {
      setTemplateImageUrls(orderedUrls);
      setTemplateMainImageUrl(mainUrl);
      setImagePreviews(orderedUrls);
      setImageFiles([]);
    } else {
      setTemplateImageUrls([]);
      setTemplateMainImageUrl(null);
      setImagePreviews([]);
      setImageFiles([]);
    }

    toast.success(`Mall "${tpl.template_name}" tillämpad`);
  };

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
      const insertPayload = {
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
        accommodation_rooms: accommodationRooms ? parseInt(accommodationRooms) : null,
        accommodation_size_sqm: accommodationSizeSqm ? parseInt(accommodationSizeSqm) : null,
        accommodation_facilities: accommodationFacilities
          ? accommodationFacilities.split(",").map(f => f.trim()).filter(Boolean)
          : null,
        accommodation_address: accommodationAddress || null,
        accommodation_description: accommodationDescription || null,
        base_price_accommodation: Number(basePriceAccommodation) || 0,
        base_price_flight: 0,
        base_price_extras: Number(basePriceExtras) || 0,
        use_duffel_flights: useDuffelFlights,
      };

      console.log("[CreateTrip] Inserting trip, user.id:", user.id);
      const { data: tripData, error: tripError } = await supabase.from("trips").insert(insertPayload as any).select('id').single();

      if (tripError) {
        console.error("[CreateTrip] Trip insert failed:", tripError.message, tripError.code, tripError.details);
        throw new Error(`Trip insert: ${tripError.message}`);
      }
      console.log("[CreateTrip] Trip created:", tripData.id);

      // Upload new image files if any
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
      // Copy template images if no new files were uploaded
      if (imageFiles.length === 0 && templateImageUrls.length > 0 && tripData) {
        for (let i = 0; i < templateImageUrls.length; i++) {
          const { error: insertError } = await supabase.from("trip_images").insert({
            trip_id: tripData.id,
            image_url: templateImageUrls[i],
            display_order: i,
          });
          if (insertError) console.error("Copy template image error:", insertError);
        }

        const mainImageUrl = templateMainImageUrl || templateImageUrls[0] || null;
        if (mainImageUrl) {
          await supabase
            .from("trips")
            .update({ image_url: mainImageUrl })
            .eq("id", tripData.id);
        }
      }
    },
    onSuccess: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success("Resa skapad!");
      form.reset();
      clearImages();
      setAccommodationRooms("");
      setAccommodationSizeSqm("");
      setAccommodationFacilities("");
      setAccommodationAddress("");
      setAccommodationDescription("");
      setBasePriceAccommodation("0");
      
      setBasePriceExtras("0");
      setTemplateImageUrls([]);
      setTemplateMainImageUrl(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      setIsUploading(false);
      const msg = error?.message || error?.details || JSON.stringify(error);
      console.error("Error creating trip:", msg, error);
      toast.error(`Kunde inte skapa resan: ${msg}`);
    },
  });

  const onSubmit = (values: TripFormValues) => {
    // For splitveckan, calculate price from base components since the field is read-only
    if (values.trip_type === "splitveckan") {
      const maxPersons = Number(values.max_persons) || 1;
      const calcPrice = calculateSplitPricePerPerson(
        Number(basePriceAccommodation),
        0,
        Number(basePriceExtras),
        maxPersons
      );
      values.price = calcPrice;
    }
    createTripMutation.mutate(values);
  };

  const selectedTripType = form.watch("trip_type");
  const isSegel = selectedTripType === "seglingsvecka" || selectedTripType === "studentveckan";
  const isSplit = selectedTripType === "splitveckan";

  const splitBoatNames = ["Inez", "Noah", "Elma", "Irma", "Alfred", "Tove"];

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
            {/* Template selector */}
            {templates && templates.length > 0 && (
              <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                <Label className="font-semibold text-sm">Fyll i från resmall</Label>
                <div className="flex gap-2 flex-wrap">
                  {templates.map((tpl: any) => (
                    <Button
                      key={tpl.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(tpl.id)}
                    >
                      {tpl.template_name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Klicka på en mall för att fylla i fälten. Du kan ändra allt efteråt.</p>
              </div>
            )}

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
                      {isSplit ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj boende" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {splitBoatNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input placeholder="t.ex. Seglingsveckan Juni 2025" {...field} />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className={cn("grid gap-4", isSplit ? "md:grid-cols-2" : isSegel ? "md:grid-cols-2" : "md:grid-cols-3")}>
                {!isSplit && (
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isSegel ? "Antal segelbåtar" : "Total kapacitet"}</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>{isSegel ? "Antal båtar tillgängliga" : "Antal platser totalt"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isSegel && (
                  <FormField
                    control={form.control}
                    name="min_persons"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min personer</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>{isSplit ? "Minsta antal på boendet" : "Minsta antal per lägenhet"}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="max_persons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max antal personer</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>{isSegel ? "Max antal resenärer" : isSplit ? "Högsta antal på boendet" : "Högsta antal per lägenhet"}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {!isSegel && !isSplit && (
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
                )}
                {isSplit && (
                  <>
                    <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Baspris för boende (kr)</label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="t.ex. 10000"
                          value={basePriceAccommodation}
                          onChange={(e) => {
                            setBasePriceAccommodation(e.target.value);
                            const total = Number(e.target.value || 0) + Number(basePriceExtras || 0);
                            form.setValue("base_price", total);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Baspris Extras (kr)</label>
                        <Input
                          type="number"
                          min={0}
                          placeholder="t.ex. 2000"
                          value={basePriceExtras}
                          onChange={(e) => {
                            setBasePriceExtras(e.target.value);
                            const total = Number(basePriceAccommodation || 0) + Number(e.target.value || 0);
                            form.setValue("base_price", total);
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Baspris för totala resan (kr)</label>
                      <Input
                        type="number"
                        readOnly
                        disabled
                        value={Number(form.watch("base_price")) || 0}
                        placeholder="Beräknas automatiskt"
                      />
                      <p className="text-sm text-muted-foreground">Summa av boende + extras</p>
                    </div>
                  </>
                )}

              {/* Duffel toggle */}
              <div className="md:col-span-2 flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="use_duffel_flights"
                  checked={useDuffelFlights}
                  onCheckedChange={(checked) => setUseDuffelFlights(!!checked)}
                />
                <div>
                  <label htmlFor="use_duffel_flights" className="text-sm font-medium cursor-pointer">
                    Dynamiskt flygpris (Duffel)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {useDuffelFlights
                      ? "Flygpriset hämtas automatiskt i realtid från Duffel"
                      : "Använd ett fast pris istället – flygpris inkluderas i totalpriset"}
                  </p>
                </div>
              </div>

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
                            onSelect={(date) => {
                              field.onChange(date);
                              if (date) {
                                setTimeout(() => setReturnDateOpen(true), 150);
                              }
                            }}
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
                      <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
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
                            onSelect={(date) => {
                              field.onChange(date);
                              setReturnDateOpen(false);
                            }}
                            disabled={(date) => {
                              const dep = form.getValues("departure_date");
                              return dep ? date <= dep : date < new Date();
                            }}
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
                {isSplit ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pris för resan (kr)</label>
                    <Input
                      type="number"
                      readOnly
                      disabled
                      value={
                        Number(basePriceAccommodation) > 0 && Number(form.watch("max_persons")) > 0
                          ? calculateSplitPricePerPerson(
                              Number(basePriceAccommodation),
                              0,
                              Number(basePriceExtras),
                              Number(form.watch("max_persons"))
                            )
                          : ""
                      }
                      placeholder="Beräknas automatiskt"
                    />
                    <p className="text-sm text-muted-foreground">Beräknat pris per person ((boende / antal + extras) × 1.20). Flygpris tillkommer dynamiskt.</p>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Dynamic pricing preview for Splitveckan */}
              {form.watch("trip_type") === "splitveckan" && Number(form.watch("base_price")) > 0 && (
                <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Prisberäkning per person (Splitveckan)</h4>
                  <p className="text-xs text-muted-foreground">
                    Formel: ((boende / antal) + extras) × 1.20 (flygpris tillkommer dynamiskt)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Array.from(
                      { length: Number(form.watch("max_persons") || 8) - Number(form.watch("min_persons") || 1) + 1 },
                      (_, i) => Number(form.watch("min_persons") || 1) + i
                    ).map((persons) => {
                      const pricePerPerson = calculateSplitPricePerPerson(
                        Number(basePriceAccommodation) || 0,
                        0,
                        Number(basePriceExtras) || 0,
                        persons
                      );
                      return (
                        <div key={persons} className="bg-background rounded p-2 text-center">
                          <div className="text-xs text-muted-foreground">{persons} pers</div>
                          <div className="font-semibold text-sm">{pricePerPerson.toLocaleString("sv-SE")} kr</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}



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

            {/* Accommodation / Boat Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{isSegel ? "Båt" : isSplit ? "Information om boende" : "Boende / Båtinformation"}</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{isSegel ? "Antal kabiner" : "Antal rum"}</label>
                  <Input
                    type="number"
                    min={0}
                    placeholder={isSegel ? "t.ex. 4" : "t.ex. 3"}
                    value={accommodationRooms}
                    onChange={(e) => setAccommodationRooms(e.target.value)}
                  />
                </div>
                {!isSegel && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Storlek (m²)</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="t.ex. 85"
                      value={accommodationSizeSqm}
                      onChange={(e) => setAccommodationSizeSqm(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Faciliteter</label>
                <Input
                  placeholder={isSegel ? "t.ex. Soltak, WiFi, Kök, AC (kommaseparerat)" : "t.ex. Pool, WiFi, Balkong, AC (kommaseparerat)"}
                  value={accommodationFacilities}
                  onChange={(e) => setAccommodationFacilities(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separera med komma</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isSegel ? "Avgångshamn" : "Adress"}</label>
                <Input
                  placeholder={isSegel ? "t.ex. Trogir Marina, Kroatien" : "t.ex. Riva 21000, Split, Kroatien"}
                  value={accommodationAddress}
                  onChange={(e) => setAccommodationAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{isSegel ? "Beskrivning av båten" : "Beskrivning av boende"}</label>
                <Textarea
                  placeholder={isSegel ? "Kort beskrivning av båten, t.ex. modell och specifikationer..." : "Kort beskrivning av boendet eller båten..."}
                  className="min-h-[80px]"
                  value={accommodationDescription}
                  onChange={(e) => setAccommodationDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-semibold">Betalningsplan</h3>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="manual-payment-plan"
                  checked={useManualPaymentPlan}
                  onCheckedChange={(checked) => {
                    setUseManualPaymentPlan(!!checked);
                    if (!checked) {
                      form.setValue("first_payment_amount", 0);
                      form.setValue("second_payment_amount", 0);
                      form.setValue("final_payment_amount", 0);
                      form.setValue("first_payment_date", null);
                      form.setValue("second_payment_date", null);
                      form.setValue("final_payment_date", null);
                    }
                  }}
                />
                <div className="space-y-1">
                  <label htmlFor="manual-payment-plan" className="text-sm font-medium cursor-pointer">
                    Anpassad betalningsplan
                  </label>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Lämna avmarkerad för att använda automatiska betalningsregler (30/35/35% baserat på tid till avresa)
                  </p>
                </div>
              </div>

              {useManualPaymentPlan && (
                <>
                  <div className="flex items-center justify-end">
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
                </>
              )}
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
