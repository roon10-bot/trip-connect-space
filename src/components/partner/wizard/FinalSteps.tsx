import { Input } from "@/components/ui/input";
import { Calendar, Settings, Home } from "lucide-react";
import type { ListingWizardData } from "../CreateListingWizard";

interface StepProps {
  data: ListingWizardData;
  updateData: (updates: Partial<ListingWizardData>) => void;
}

export function PriceStep({ data, updateData }: StepProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
        Ange dygnspris
      </h2>
      <p className="text-muted-foreground mb-8">
        Du kan ändra priset när som helst.
      </p>

      <div className="flex items-center justify-center gap-3 py-8">
        <div className="relative">
          <Input
            type="number"
            min={0}
            value={data.dailyPrice || ""}
            onChange={(e) => updateData({ dailyPrice: Number(e.target.value) || 0 })}
            className="text-4xl font-bold text-center w-48 h-20 border-2"
            placeholder="0"
          />
        </div>
        <span className="text-2xl text-muted-foreground font-medium">kr / natt</span>
      </div>
    </div>
  );
}

export function PublishStep({ data, isSubmitting }: StepProps & { isSubmitting: boolean }) {
  const coverImage = data.images[data.mainImageIndex] || data.images[0];

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-6">
        🎉 Jippie! Dags att publicera.
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {coverImage ? (
          <div className="rounded-xl overflow-hidden border aspect-[4/3]">
            <img src={coverImage} alt={data.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-xl border bg-muted flex items-center justify-center aspect-[4/3]">
            <Home className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}

        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-serif font-bold text-foreground mb-1">{data.name || "Ditt boende"}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {data.city && data.country ? `${data.city}, ${data.country}` : ""}
          </p>
          <p className="text-lg font-semibold text-foreground">{data.dailyPrice} kr / natt</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            <span>{data.guests} gäster</span>
            <span>·</span>
            <span>{data.bedrooms} sovrum</span>
            <span>·</span>
            <span>{data.beds} sängar</span>
            <span>·</span>
            <span>{data.bathrooms} badrum</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-5">Vad händer härnäst?</h3>

        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-ocean/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-ocean" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Ställ in din kalender</h4>
              <p className="text-sm text-muted-foreground">
                Välj vilka datum som finns tillgängliga. Gäster kan börja boka ditt boende 24 timmar efter att du publicerat.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-ocean/10 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-ocean" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Justera dina inställningar</h4>
              <p className="text-sm text-muted-foreground">
                Ange husregler, välj en avbokningspolicy, välj hur gäster kan boka, med mera.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
