import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, Loader2, Upload, X, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const TRIP_TYPE_LABELS: Record<string, string> = {
  seglingsvecka: "Seglingsveckan",
  splitveckan: "Splitveckan",
  studentveckan: "Studentveckan",
};

const splitBoatNames = ["Inez", "Noah", "Elma", "Irma", "Alfred", "Tove"];

interface TripTemplate {
  id: string;
  template_name: string;
  trip_type: string;
  name: string | null;
  capacity: number | null;
  min_persons: number | null;
  max_persons: number | null;
  description: string | null;
  accommodation_rooms: number | null;
  accommodation_size_sqm: number | null;
  accommodation_facilities: string[] | null;
  accommodation_address: string | null;
  accommodation_description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const templateSchema = z.object({
  template_name: z.string().min(2, "Mallnamn krävs"),
  trip_type: z.enum(["seglingsvecka", "splitveckan", "studentveckan"], {
    required_error: "Välj en restyp",
  }),
  name: z.string().optional(),
  capacity: z.coerce.number().min(1).optional(),
  min_persons: z.coerce.number().min(1).optional(),
  max_persons: z.coerce.number().min(1).optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

// ─── Template Form Dialog ───────────────────────────────────────────

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: TripTemplate | null;
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const TemplateFormDialog = ({ open, onOpenChange, template, onSave, saving }: TemplateFormDialogProps) => {
  const [accommodationRooms, setAccommodationRooms] = useState("");
  const [accommodationSizeSqm, setAccommodationSizeSqm] = useState("");
  const [accommodationFacilities, setAccommodationFacilities] = useState("");
  const [accommodationAddress, setAccommodationAddress] = useState("");
  const [accommodationDescription, setAccommodationDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      template_name: "",
      trip_type: undefined,
      name: "",
      capacity: 20,
      min_persons: 1,
      max_persons: 8,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (open && template) {
      form.reset({
        template_name: template.template_name,
        trip_type: template.trip_type as any,
        name: template.name || "",
        capacity: template.capacity || 20,
        min_persons: template.min_persons || 1,
        max_persons: template.max_persons || 8,
      });
      setAccommodationRooms(template.accommodation_rooms?.toString() || "");
      setAccommodationSizeSqm(template.accommodation_size_sqm?.toString() || "");
      setAccommodationFacilities((template.accommodation_facilities || []).join(", "));
      setAccommodationAddress(template.accommodation_address || "");
      setAccommodationDescription(template.accommodation_description || "");
      setExistingImageUrl(template.image_url || null);
      setImageFiles([]);
      setImagePreviews([]);
    } else if (open && !template) {
      form.reset({
        template_name: "",
        trip_type: undefined,
        name: "",
        capacity: 20,
        min_persons: 1,
        max_persons: 8,
      });
      setAccommodationRooms("");
      setAccommodationSizeSqm("");
      setAccommodationFacilities("");
      setAccommodationAddress("");
      setAccommodationDescription("");
      setExistingImageUrl(null);
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [open, template]);

  const selectedTripType = form.watch("trip_type");
  const isSegel = selectedTripType === "seglingsvecka" || selectedTripType === "studentveckan";
  const isSplit = selectedTripType === "splitveckan";

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
    setImageFiles((prev) => [...prev, ...accepted]);
    setImagePreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeImageAt = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: TemplateFormValues) => {
    const result: Record<string, unknown> = {
      template_name: values.template_name,
      trip_type: values.trip_type,
      name: values.name || null,
      capacity: isSplit ? null : (values.capacity || null),
      min_persons: isSegel ? null : (values.min_persons || null),
      max_persons: values.max_persons || null,
      accommodation_rooms: accommodationRooms ? parseInt(accommodationRooms) : null,
      accommodation_size_sqm: accommodationSizeSqm ? parseInt(accommodationSizeSqm) : null,
      accommodation_facilities: accommodationFacilities
        ? accommodationFacilities.split(",").map((f) => f.trim()).filter(Boolean)
        : null,
      accommodation_address: accommodationAddress || null,
      accommodation_description: accommodationDescription || null,
    };
    onSave({ ...result, _imageFiles: imageFiles, _existingImageUrl: existingImageUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {template ? "Redigera resmall" : "Skapa resmall"}
          </DialogTitle>
          <DialogDescription>
            {template
              ? "Uppdatera mallens information."
              : "Fyll i informationen nedan för att skapa en ny resmall. Mallen kan sedan användas för att snabbt skapa nya resor."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Mallnamn */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="template_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mallnamn</FormLabel>
                    <FormControl>
                      <Input placeholder="t.ex. Splitveckan Inez Standard" {...field} />
                    </FormControl>
                    <FormDescription>Internt namn för mallen, visas bara för admin</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grundinformation */}
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
                      <FormLabel>{isSplit ? "Välj boende" : "Namn på resa"}</FormLabel>
                      {isSplit ? (
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input placeholder="t.ex. Seglingsveckan" {...field} />
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
            </div>

            {/* Boende / Båtinformation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                {isSegel ? "Båt" : isSplit ? "Information om boende" : "Boende / Båtinformation"}
              </h3>

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

            {/* Bilder */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Bilder</h3>
              <p className="text-sm text-muted-foreground">
                Ladda upp bilder som kopplas till mallen (max 5 MB per bild)
              </p>

              {existingImageUrl && imageFiles.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Befintlig bild:</p>
                  <div className="relative group w-32">
                    <img
                      src={existingImageUrl}
                      alt="Mallbild"
                      className="w-full aspect-square object-cover rounded-lg border"
                      loading="lazy"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setExistingImageUrl(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

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
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {imagePreviews.map((src, idx) => (
                    <div key={`${idx}-${src.slice(0, 16)}`} className="relative group">
                      <img
                        src={src}
                        alt={`Förhandsvisning ${idx + 1}`}
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
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Sparar..." : template ? "Uppdatera mall" : "Skapa mall"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Templates List ─────────────────────────────────────────────────

export const TripTemplatesList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<TripTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["trip-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_templates" as any)
        .select("*")
        .order("trip_type")
        .order("template_name");
      if (error) throw error;
      return data as unknown as TripTemplate[];
    },
  });

  const uploadTemplateImages = async (templateId: string, files: File[]): Promise<string | null> => {
    if (!files.length) return null;
    let firstUrl: string | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `templates/${templateId}/${Date.now()}-${i}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("trip-images")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("trip-images").getPublicUrl(fileName);
      if (!firstUrl) firstUrl = publicUrl;
    }
    return firstUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const imageFiles = (values._imageFiles as File[]) || [];
      const existingImageUrl = values._existingImageUrl as string | null;
      const { _imageFiles, _existingImageUrl, ...dbValues } = values;

      // Insert template first
      const { data, error } = await supabase
        .from("trip_templates" as any)
        .insert({ ...dbValues, created_by: user?.id } as any)
        .select("id")
        .single();
      if (error) throw error;

      // Upload images if any
      if (imageFiles.length > 0 && data) {
        const imageUrl = await uploadTemplateImages((data as any).id, imageFiles);
        if (imageUrl) {
          await supabase
            .from("trip_templates" as any)
            .update({ image_url: imageUrl } as any)
            .eq("id", (data as any).id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall skapad!");
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const imageFiles = (values._imageFiles as File[]) || [];
      const existingImageUrl = values._existingImageUrl as string | null;
      const { _imageFiles, _existingImageUrl, ...dbValues } = values;

      // Upload new images if any
      let imageUrl = existingImageUrl;
      if (imageFiles.length > 0) {
        imageUrl = await uploadTemplateImages(id, imageFiles);
      }

      const { error } = await supabase
        .from("trip_templates" as any)
        .update({ ...dbValues, image_url: imageUrl } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall uppdaterad!");
      setEditTemplate(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trip_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall borttagen!");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const grouped = (templates || []).reduce<Record<string, TripTemplate[]>>((acc, t) => {
    (acc[t.trip_type] = acc[t.trip_type] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Resmallar</h2>
          <p className="text-muted-foreground">Skapa och hantera mallar för att snabbt skapa nya resor.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Skapa mall
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !templates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Inga mallar skapade ännu.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa din första mall
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="secondary">{TRIP_TYPE_LABELS[type] || type}</Badge>
              <span className="text-sm text-muted-foreground font-normal">
                {items.length} {items.length === 1 ? "mall" : "mallar"}
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <Card key={t.id} className="group hover:shadow-md transition-shadow overflow-hidden">
                  {t.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={t.image_url}
                        alt={t.template_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{t.template_name}</CardTitle>
                        {t.name && (
                          <CardDescription className="mt-1">{t.name}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.capacity != null && <Badge variant="outline">Kap: {t.capacity}</Badge>}
                      {t.max_persons != null && <Badge variant="outline">Max: {t.max_persons} pers</Badge>}
                      {t.accommodation_address && <Badge variant="outline">{t.accommodation_address}</Badge>}
                      {t.accommodation_rooms != null && (
                        <Badge variant="outline">{t.accommodation_rooms} rum</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditTemplate(t)}>
                        <Pencil className="w-3 h-3 mr-1" />
                        Redigera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Ta bort
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create dialog */}
      <TemplateFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={(data) => createMutation.mutate(data)}
        saving={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editTemplate && (
        <TemplateFormDialog
          open={!!editTemplate}
          onOpenChange={(v) => !v && setEditTemplate(null)}
          template={editTemplate}
          onSave={(data) => updateMutation.mutate({ id: editTemplate.id, values: data })}
          saving={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort mall?</AlertDialogTitle>
            <AlertDialogDescription>
              Mallen tas bort permanent. Detta påverkar inte redan skapade resor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
