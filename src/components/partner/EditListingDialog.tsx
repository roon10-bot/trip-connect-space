import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wifi, Tv, UtensilsCrossed, Car, Snowflake, Monitor,
  Bell, Heart, Flame, Upload, X, Star, Loader2, ImageIcon, Minus, Plus, Droplets, CircleParking,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Listing {
  id: string;
  partner_id: string;
  name: string;
  description: string | null;
  destination: string;
  country: string;
  address: string | null;
  capacity: number;
  rooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  facilities: string[] | null;
  image_url: string | null;
  image_urls: string[] | null;
  property_type: string | null;
  access_type: string | null;
  daily_price: number | null;
  size_sqm: number | null;
  status: string;
}

interface Props {
  listing: Listing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allAmenities = [
  { value: "Wifi", icon: Wifi },
  { value: "TV", icon: Tv },
  { value: "Kök", icon: UtensilsCrossed },
  { value: "Tvättmaskin", icon: Droplets },
  { value: "Gratis parkering", icon: Car },
  { value: "Betald parkering", icon: CircleParking },
  { value: "Luftkonditionering", icon: Snowflake },
  { value: "Arbetsyta/kontor", icon: Monitor },
  { value: "Brandvarnare", icon: Bell },
  { value: "Förbandslåda", icon: Heart },
  { value: "Brandsläckare", icon: Flame },
];

function Counter({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-sm font-medium w-4 text-center">{value}</span>
        <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => onChange(value + 1)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export const EditListingDialog = ({ listing, open, onOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [name, setName] = useState(listing.name);
  const [description, setDescription] = useState(listing.description || "");
  const [address, setAddress] = useState(listing.address || "");
  const [destination, setDestination] = useState(listing.destination);
  const [country, setCountry] = useState(listing.country);
  const [capacity, setCapacity] = useState(listing.capacity);
  const [rooms, setRooms] = useState(listing.rooms || 0);
  const [beds, setBeds] = useState(listing.beds || 1);
  const [bathrooms, setBathrooms] = useState(listing.bathrooms || 1);
  const [dailyPrice, setDailyPrice] = useState(listing.daily_price || 0);
  const [amenities, setAmenities] = useState<string[]>(listing.facilities || []);
  const [images, setImages] = useState<string[]>(listing.image_urls || []);
  const [mainImage, setMainImage] = useState(listing.image_url || "");

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} är för stor (max 5 MB)`);
        continue;
      }
      const ext = file.name.split(".").pop();
      const fileName = `${listing.partner_id}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("partner-listing-images").upload(fileName, file);
      if (error) {
        toast.error(`Kunde inte ladda upp ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("partner-listing-images").getPublicUrl(fileName);
      newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) {
      setImages((prev) => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} bild(er) uppladdade`);
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    const url = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (url === mainImage) {
      setMainImage(images[0] === url ? images[1] || "" : images[0] || "");
    }
  };

  const getChangedFields = () => {
    const changes: { field: string; from: string; to: string }[] = [];
    const check = (label: string, oldVal: any, newVal: any) => {
      const o = String(oldVal ?? "");
      const n = String(newVal ?? "");
      if (o !== n) changes.push({ field: label, from: o, to: n });
    };
    check("Namn", listing.name, name);
    check("Beskrivning", listing.description, description);
    check("Adress", listing.address, address);
    check("Stad", listing.destination, destination);
    check("Land", listing.country, country);
    check("Kapacitet", listing.capacity, capacity);
    check("Sovrum", listing.rooms, rooms);
    check("Sängar", listing.beds, beds);
    check("Badrum", listing.bathrooms, bathrooms);
    check("Dygnspris", listing.daily_price, dailyPrice);

    const oldAmenities = (listing.facilities || []).sort().join(", ");
    const newAmenities = [...amenities].sort().join(", ");
    if (oldAmenities !== newAmenities) changes.push({ field: "Bekvämligheter", from: oldAmenities, to: newAmenities });

    const oldImgCount = (listing.image_urls || []).length;
    const newImgCount = images.length;
    if (oldImgCount !== newImgCount) changes.push({ field: "Antal bilder", from: String(oldImgCount), to: String(newImgCount) });

    if ((listing.image_url || "") !== (mainImage || images[0] || "")) changes.push({ field: "Omslagsbild", from: "ändrad", to: "ny bild" });

    return changes;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const changes = getChangedFields();

      const { error } = await supabase
        .from("partner_listings")
        .update({
          name,
          description,
          address,
          destination,
          country,
          capacity,
          rooms,
          beds,
          bathrooms,
          daily_price: dailyPrice,
          facilities: amenities,
          image_url: mainImage || images[0] || null,
          image_urls: images,
        })
        .eq("id", listing.id);
      if (error) throw error;

      // Send admin notification about changes
      if (changes.length > 0) {
        supabase.functions.invoke("admin-notifications", {
          body: {
            type: "listing_updated",
            data: {
              name: listing.name,
              listing_id: listing.id,
              destination: listing.destination,
              country: listing.country,
              changes,
            },
          },
        }).catch(console.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerListings"] });
      toast.success("Boendet har uppdaterats");
      onOpenChange(false);
    },
    onError: () => toast.error("Kunde inte spara ändringarna"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Redigera boende</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Namn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Beskrivning</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label>Adress</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stad</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Land</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          {/* Counters */}
          <div className="border rounded-lg p-4">
            <Counter label="Gäster" value={capacity} onChange={setCapacity} min={1} />
            <Counter label="Sovrum" value={rooms} onChange={setRooms} min={0} />
            <Counter label="Sängar" value={beds} onChange={setBeds} min={1} />
            <Counter label="Badrum" value={bathrooms} onChange={setBathrooms} min={0} />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label>Dygnspris (kr)</Label>
            <Input
              type="number"
              min={0}
              value={dailyPrice || ""}
              onChange={(e) => setDailyPrice(Number(e.target.value) || 0)}
            />
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Bekvämligheter</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allAmenities.map(({ value, icon: Icon }) => {
                const selected = amenities.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleAmenity(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs",
                      selected ? "border-ocean bg-ocean/5" : "border-border hover:border-ocean/40"
                    )}
                  >
                    <Icon className="w-5 h-5 text-foreground" />
                    <span className="text-foreground font-medium">{value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Bilder</Label>
            <label className="cursor-pointer block">
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                isUploading ? "border-ocean/40 bg-ocean/5" : "border-border hover:border-ocean/40"
              )}>
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-ocean mx-auto" />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground mx-auto" />
                )}
                <p className="text-sm text-foreground mt-1">{isUploading ? "Laddar upp..." : "Lägg till bilder"}</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <ImageIcon className="w-3 h-3" /> JPG, PNG, WEBP – max 5 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && e.target.files.length > 0 && handleUpload(e.target.files)}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {images.map((url, index) => {
                  const isMain = url === mainImage;
                  return (
                    <div
                      key={url}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border-2 aspect-square",
                        isMain ? "border-ocean ring-2 ring-ocean/30" : "border-transparent"
                      )}
                    >
                      <img src={url} alt={`Bild ${index + 1}`} className="w-full h-full object-cover" />
                      {isMain && (
                        <span className="absolute top-1 left-1 bg-ocean text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Omslag
                        </span>
                      )}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant={isMain ? "default" : "secondary"}
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setMainImage(url)}
                          disabled={isMain}
                        >
                          <Star className={cn("h-3 w-3", isMain && "fill-current")} />
                        </Button>
                        <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeImage(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {listing.status === "approved" && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              ⚠️ Ändringar i ett godkänt boende kräver nytt godkännande från administratören.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !name.trim()}
              className="bg-ocean hover:bg-ocean/90 text-white"
            >
              {updateMutation.isPending ? "Sparar..." : "Spara ändringar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
