import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Calendar, Settings, Home } from "lucide-react";
import type { ListingWizardData } from "../CreateListingWizard";

interface StepProps {
  data: ListingWizardData;
  updateData: (updates: Partial<ListingWizardData>) => void;
}

export function PriceStep({ data, updateData }: StepProps) {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{t("partner.wizard.priceTitle")}</h2>
      <p className="text-muted-foreground mb-8">{t("partner.wizard.priceDesc")}</p>
      <div className="flex items-center justify-center gap-3 py-8">
        <Input type="number" min={0} value={data.dailyPrice || ""} onChange={(e) => updateData({ dailyPrice: Number(e.target.value) || 0 })} className="text-4xl font-bold text-center w-48 h-20 border-2" placeholder="0" />
        <span className="text-2xl text-muted-foreground font-medium">{t("partner.wizard.perNight")}</span>
      </div>
    </div>
  );
}

export function PublishStep({ data, isSubmitting }: StepProps & { isSubmitting: boolean }) {
  const { t } = useTranslation();
  const coverImage = data.images[data.mainImageIndex] || data.images[0];

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6">{t("partner.wizard.publishTitle")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {coverImage ? (
          <div className="rounded-xl overflow-hidden border aspect-[4/3]"><img src={coverImage} alt={data.name} className="w-full h-full object-cover" /></div>
        ) : (
          <div className="rounded-xl border bg-muted flex items-center justify-center aspect-[4/3]"><Home className="w-12 h-12 text-muted-foreground/40" /></div>
        )}
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-serif font-bold text-foreground mb-1">{data.name || t("partner.wizard.yourListing")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{data.city && data.country ? `${data.city}, ${data.country}` : ""}</p>
          <p className="text-lg font-semibold text-foreground">{data.dailyPrice} {t("partner.wizard.perNight")}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            <span>{data.guests} {t("partner.wizard.guests").toLowerCase()}</span><span>·</span>
            <span>{data.bedrooms} {t("partner.wizard.bedrooms").toLowerCase()}</span><span>·</span>
            <span>{data.beds} {t("partner.wizard.beds").toLowerCase()}</span><span>·</span>
            <span>{data.bathrooms} {t("partner.wizard.bathrooms").toLowerCase()}</span>
          </div>
        </div>
      </div>
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">{t("partner.wizard.whatHappensNext")}</h3>
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-ocean/10 flex items-center justify-center shrink-0"><Calendar className="w-5 h-5 text-ocean" /></div>
            <div>
              <h4 className="font-medium text-foreground">{t("partner.wizard.calendarTitle")}</h4>
              <p className="text-sm text-muted-foreground">{t("partner.wizard.calendarDesc")}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-ocean/10 flex items-center justify-center shrink-0"><Settings className="w-5 h-5 text-ocean" /></div>
            <div>
              <h4 className="font-medium text-foreground">{t("partner.wizard.settingsTitle")}</h4>
              <p className="text-sm text-muted-foreground">{t("partner.wizard.settingsDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}