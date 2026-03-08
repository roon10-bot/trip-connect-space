import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  { key: "wifi", icon: Wifi },
  { key: "tv", icon: Tv },
  { key: "kitchen", icon: UtensilsCrossed },
  { key: "washingMachine", icon: Droplets },
  { key: "freeParking", icon: Car },
  { key: "paidParking", icon: CircleParking },
  { key: "ac", icon: Snowflake },
  { key: "workspace", icon: Monitor },
];

const safetyItems = [
  { key: "smokeAlarm", icon: Bell },
  { key: "firstAid", icon: Heart },
  { key: "fireExtinguisher", icon: Flame },
];

export function AmenitiesStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  const toggle = (amenity: string) => {
    const current = data.amenities;
    updateData({ amenities: current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity] });
  };

  const AmenityButton = ({ amenityKey, icon: Icon }: { amenityKey: string; icon: React.ElementType }) => {
    const label = t(`partner.amenityLabels.${amenityKey}`);
    const selected = data.amenities.includes(label);
    return (
      <button onClick={() => toggle(label)}
        className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
          selected ? "border-ocean bg-ocean/5 shadow-sm" : "border-border hover:border-ocean/40")}>
        <Icon className="w-7 h-7 text-foreground" />
        <span className="text-sm font-medium text-foreground text-center">{label}</span>
      </button>
    );
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-1">{t("partner.wizard.amenitiesTitle")}</h2>
      <p className="text-muted-foreground mb-8">{t("partner.wizard.amenitiesAddLater")}</p>
      <h3 className="font-semibold text-foreground mb-4">{t("partner.wizard.guestFavorites")}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
        {guestFavorites.map((item) => <AmenityButton key={item.key} amenityKey={item.key} icon={item.icon} />)}
      </div>
      <h3 className="font-semibold text-foreground mb-4">{t("partner.wizard.safetyEquipment")}</h3>
      <div className="grid grid-cols-3 gap-3">
        {safetyItems.map((item) => <AmenityButton key={item.key} amenityKey={item.key} icon={item.icon} />)}
      </div>
    </div>
  );
}

export function PhotosStep({ data, updateData, partnerId }: StepProps & { partnerId: string }) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} ${t("partner.editDialog.tooLarge")}`); continue; }
      const ext = file.name.split(".").pop();
      const fileName = `${partnerId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("partner-listing-images").upload(fileName, file);
      if (error) { toast.error(`${t("partner.editDialog.uploadError")} ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("partner-listing-images").getPublicUrl(fileName);
      newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) {
      updateData({ images: [...data.images, ...newUrls] });
      toast.success(t("partner.editDialog.imagesUploaded", { count: newUrls.length }));
    }
    setIsUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = data.images.filter((_, i) => i !== index);
    updateData({ images: newImages, mainImageIndex: data.mainImageIndex === index ? 0 : data.mainImageIndex > index ? data.mainImageIndex - 1 : data.mainImageIndex });
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.photosTitle")}</h2>
      <p className="text-muted-foreground mb-6">{t("partner.wizard.photosDesc")}</p>
      <label className="cursor-pointer">
        <div className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-colors", isUploading ? "border-ocean/40 bg-ocean/5" : "border-border hover:border-ocean/40")}>
          {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-ocean mx-auto mb-2" /> : <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />}
          <p className="font-medium text-foreground">{isUploading ? t("partner.editDialog.uploading") : t("partner.wizard.clickToSelect")}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><ImageIcon className="w-3 h-3" /> JPG, PNG, WEBP – max 5 MB</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => e.target.files && e.target.files.length > 0 && handleUpload(e.target.files)} className="hidden" disabled={isUploading} />
      </label>
      {data.images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-6">
          {data.images.map((url, index) => {
            const isMain = index === data.mainImageIndex;
            return (
              <div key={url} className={cn("relative group rounded-lg overflow-hidden border-2 aspect-square", isMain ? "border-ocean ring-2 ring-ocean/30" : "border-transparent")}>
                <img src={url} alt={`${index + 1}`} className="w-full h-full object-cover" />
                {isMain && <span className="absolute top-1 left-1 bg-ocean text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{t("partner.wizard.cover")}</span>}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button type="button" variant={isMain ? "default" : "secondary"} size="icon" className="h-6 w-6" onClick={() => updateData({ mainImageIndex: index })} disabled={isMain}><Star className={cn("h-3 w-3", isMain && "fill-current")} /></Button>
                  <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeImage(index)}><X className="h-3 w-3" /></Button>
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
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.nameTitle")}</h2>
      <p className="text-muted-foreground mb-8">{t("partner.wizard.nameDesc")}</p>
      <Input value={data.name} onChange={(e) => updateData({ name: e.target.value })} placeholder={t("partner.wizard.namePlaceholder")} className="text-lg py-6" maxLength={80} />
      <p className="text-xs text-muted-foreground mt-2 text-right">{data.name.length}/80</p>
    </div>
  );
}

export function DescriptionStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.descTitle")}</h2>
      <p className="text-muted-foreground mb-6">{t("partner.wizard.descDesc")}</p>
      <Textarea value={data.description} onChange={(e) => updateData({ description: e.target.value })} placeholder={t("partner.wizard.descPlaceholder")} rows={6} className="text-base resize-none" maxLength={1000} />
      <p className="text-xs text-muted-foreground mt-2 text-right">{data.description.length}/1000</p>
    </div>
  );
}