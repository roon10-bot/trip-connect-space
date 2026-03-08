import { useTranslation } from "react-i18next";
import { Building2, Home, Hotel, DoorOpen, Minus, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ListingWizardData } from "../CreateListingWizard";

interface StepProps {
  data: ListingWizardData;
  updateData: (updates: Partial<ListingWizardData>) => void;
}

export function PropertyTypeStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  const propertyTypes = [
    { value: "apartment", label: t("partner.wizard.apartment"), icon: Building2 },
    { value: "house", label: t("partner.wizard.house"), icon: Home },
    { value: "hotel", label: t("partner.wizard.hotel"), icon: Hotel },
  ];

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.propertyTypeTitle")}</h2>
      <div className="grid grid-cols-1 gap-3 mt-8">
        {propertyTypes.map((opt) => (
          <button key={opt.value} onClick={() => updateData({ propertyType: opt.value })}
            className={cn("flex items-center gap-5 p-5 rounded-xl border-2 transition-all text-left",
              data.propertyType === opt.value ? "border-ocean bg-ocean/5 shadow-sm" : "border-border hover:border-ocean/40")}>
            <opt.icon className="w-8 h-8 text-foreground shrink-0" />
            <span className="text-lg font-medium text-foreground">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AccessTypeStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  const accessTypes = [
    { value: "entire", label: t("partner.wizard.entirePlace"), description: t("partner.wizard.entirePlaceDesc"), icon: Home },
    { value: "room", label: t("partner.wizard.room"), description: t("partner.wizard.roomDesc"), icon: DoorOpen },
  ];

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.accessTypeTitle")}</h2>
      <div className="grid grid-cols-1 gap-3 mt-8">
        {accessTypes.map((opt) => (
          <button key={opt.value} onClick={() => updateData({ accessType: opt.value })}
            className={cn("flex items-center gap-5 p-5 rounded-xl border-2 transition-all text-left",
              data.accessType === opt.value ? "border-ocean bg-ocean/5 shadow-sm" : "border-border hover:border-ocean/40")}>
            <opt.icon className="w-8 h-8 text-foreground shrink-0" />
            <div>
              <span className="text-lg font-medium text-foreground block">{opt.label}</span>
              <span className="text-sm text-muted-foreground">{opt.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddressStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  const fullAddress = [data.street, data.city, data.country].filter(Boolean).join(", ");
  const hasAddress = data.street && data.city && data.country;

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.addressTitle")}</h2>
      <p className="text-muted-foreground mb-8">{t("partner.wizard.addressDesc")}</p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="street">{t("partner.wizard.street")}</Label>
          <Input id="street" value={data.street} onChange={(e) => updateData({ street: e.target.value })} placeholder="t.ex. Riva 21000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">{t("partner.wizard.city")}</Label>
            <Input id="city" value={data.city} onChange={(e) => updateData({ city: e.target.value })} placeholder="t.ex. Split" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">{t("partner.wizard.country")}</Label>
            <Input id="country" value={data.country} onChange={(e) => updateData({ country: e.target.value })} placeholder="t.ex. Kroatien" />
          </div>
        </div>
      </div>
      {hasAddress && (
        <div className="mt-6 rounded-xl overflow-hidden border">
          <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed&z=15`} className="w-full h-56 sm:h-64" loading="lazy" title={t("partner.wizard.mapView")} style={{ border: 0 }} />
          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" /><span>{fullAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Counter({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between py-5 border-b last:border-b-0">
      <span className="text-lg text-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}><Minus className="w-4 h-4" /></Button>
        <span className="text-lg font-medium w-6 text-center">{value}</span>
        <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => onChange(value + 1)}><Plus className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

export function BasicInfoStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.basicInfoTitle")}</h2>
      <div className="mt-8">
        <Counter label={t("partner.wizard.guests")} value={data.guests} onChange={(v) => updateData({ guests: v })} min={1} />
        <Counter label={t("partner.wizard.bedrooms")} value={data.bedrooms} onChange={(v) => updateData({ bedrooms: v })} min={0} />
        <Counter label={t("partner.wizard.beds")} value={data.beds} onChange={(v) => updateData({ beds: v })} min={1} />
        <Counter label={t("partner.wizard.bathrooms")} value={data.bathrooms} onChange={(v) => updateData({ bathrooms: v })} min={0} />
      </div>
    </div>
  );
}