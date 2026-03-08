import { useState, useRef } from "react";
import {
  Wifi, Tv, UtensilsCrossed, Car, Snowflake, Monitor,
  Bell, Heart, Flame, Upload, X, Star, Loader2, ImageIcon, Droplets, CircleParking,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ListingWizardData } from "../CreateListingWizard";

interface StepProps {
  data: ListingWizardData;
  updateData: (updates: Partial<ListingWizardData>) => void;
}

const guestFavorites = [
  { value: "Wifi", icon: Wifi },
  { value: "TV", icon: Tv },
  { value: "Kök", icon: UtensilsCrossed },
  { value: "Tvättmaskin", icon: Droplets },
  { value: "Gratis parkering", icon: Car },
  { value: "Betald parkering", icon: CircleParking },
  { value: "Luftkonditionering", icon: Snowflake },
  { value: "Arbetsyta/kontor", icon: Monitor },
];

const safetyItems = [
  { value: "Brandvarnare", icon: Bell },
  { value: "Förbandslåda", icon: Heart },
  { value: "Brandsläckare", icon: Flame },
];

export function AmenitiesStep({ data, updateData }: StepProps) {
  const toggle = (amenity: string) => {
    const current = data.amenities;
    updateData({
      amenities: current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    });
  };

  const AmenityButton = ({ value, icon: Icon }: { value: string; icon: React.ElementType }) => {
    const selected = data.amenities.includes(value);
    return (
      <button
        onClick={() => toggle(value)}
        className={cn(
          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
          selected
            ? "border-ocean bg-ocean/5 shadow-sm"
            : "border-border hover:border-ocean/40"
        )}
      >
        <Icon className="w-7 h-7 text-foreground" />
        <span className="text-sm font-medium text-foreground text-center">{value}</span>
      </button>
    );
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-1">
        Låt gäster veta vad ditt boende har att erbjuda
      </h2>
      <p className="text-muted-foreground mb-8">Du kan lägga till fler bekvämligheter senare.</p>

      <h3 className="font-semibold text-foreground mb-4">Finns några av dessa gästfavoriter?</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
        {guestFavorites.map((item) => (
          <AmenityButton key={item.value} {...item} />
        ))}
      </div>

      <h3 className="font-semibold text-foreground mb-4">Har du någon av dessa säkerhetsutrustningar?</h3>
      <div className="grid grid-cols-3 gap-3">
        {safetyItems.map((item) => (
          <AmenityButton key={item.value} {...item} />
        ))}
      </div>
    </div>
  );
}

export function PhotosStep({ data, updateData, partnerId }: StepProps & { partnerId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const fileName = `${partnerId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("partner-listing-images").upload(fileName, file);
      if (error) {
        toast.error(`Kunde inte ladda upp ${file.name}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("partner-listing-images").getPublicUrl(fileName);
      newUrls.push(urlData.publicUrl);
    }

    if (newUrls.length > 0) {
      updateData({ images: [...data.images, ...newUrls] });
      toast.success(`${newUrls.length} bild(er) uppladdade`);
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = data.images.filter((_, i) => i !== index);
    updateData({
      images: newImages,
      mainImageIndex: data.mainImageIndex === index
        ? 0
        : data.mainImageIndex > index
          ? data.mainImageIndex - 1
          : data.mainImageIndex,
    });
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
        Lägg till foton av ditt boende
      </h2>
      <p className="text-muted-foreground mb-6">
        Lägg till minst 1 foto. Klicka på ⭐ för att välja omslagsbild.
      </p>

      <label className="cursor-pointer">
        <div className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          isUploading ? "border-ocean/40 bg-ocean/5" : "border-border hover:border-ocean/40"
        )}>
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto mb-2" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          )}
          <p className="font-medium text-foreground">
            {isUploading ? "Laddar upp..." : "Klicka för att välja bilder"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
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

      {data.images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-6">
          {data.images.map((url, index) => {
            const isMain = index === data.mainImageIndex;
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
                    onClick={() => updateData({ mainImageIndex: index })}
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
  );
}

export function NameStep({ data, updateData }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
        Då var det dags att ge ditt boende ett namn
      </h2>
      <p className="text-muted-foreground mb-8">
        Kort och beskrivande namn fungerar bäst. Oroa dig inte, du kan ändra det senare.
      </p>
      <Input
        value={data.name}
        onChange={(e) => updateData({ name: e.target.value })}
        placeholder="t.ex. Villa Sunset med utsikt"
        className="text-lg py-6"
        maxLength={80}
      />
      <p className="text-xs text-muted-foreground mt-2 text-right">{data.name.length}/80</p>
    </div>
  );
}

export function DescriptionStep({ data, updateData }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
        Skapa din beskrivning
      </h2>
      <p className="text-muted-foreground mb-6">
        Dela med dig av vad som är speciellt med ditt boende.
      </p>
      <Textarea
        value={data.description}
        onChange={(e) => updateData({ description: e.target.value })}
        placeholder="Beskriv ditt boende, omgivningen och vad gäster kan förvänta sig..."
        rows={6}
        className="text-base resize-none"
        maxLength={1000}
      />
      <p className="text-xs text-muted-foreground mt-2 text-right">{data.description.length}/1000</p>
    </div>
  );
}
