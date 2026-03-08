import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import { PropertyTypeStep, AccessTypeStep, AddressStep, BasicInfoStep } from "./wizard/PropertySteps";
import { AmenitiesStep, PhotosStep, NameStep, DescriptionStep } from "./wizard/DetailSteps";
import { PriceStep, PublishStep } from "./wizard/FinalSteps";

export interface ListingWizardData {
  propertyType: string;
  accessType: string;
  street: string;
  city: string;
  country: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  mainImageIndex: number;
  name: string;
  description: string;
  dailyPrice: number;
}

const defaultData: ListingWizardData = {
  propertyType: "",
  accessType: "",
  street: "",
  city: "",
  country: "",
  guests: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [],
  images: [],
  mainImageIndex: 0,
  name: "",
  description: "",
  dailyPrice: 0,
};

const TOTAL_SLIDES = 13;

interface Props {
  partnerId: string;
  onClose: () => void;
  onComplete: () => void;
}

export const CreateListingWizard = ({ partnerId, onClose, onComplete }: Props) => {
  const [slide, setSlide] = useState(0);
  const [data, setData] = useState<ListingWizardData>(defaultData);
  const [direction, setDirection] = useState(1);
  const queryClient = useQueryClient();

  const updateData = useCallback((updates: Partial<ListingWizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => {
    if (slide < TOTAL_SLIDES - 1) {
      setDirection(1);
      setSlide((s) => s + 1);
    }
  };

  const goBack = () => {
    if (slide > 0) {
      setDirection(-1);
      setSlide((s) => s - 1);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("partner_listings").insert({
        partner_id: partnerId,
        name: data.name,
        description: data.description,
        destination: data.city,
        country: data.country,
        address: [data.street, data.city, data.country].filter(Boolean).join(", "),
        capacity: data.guests,
        rooms: data.bedrooms,
        beds: data.beds,
        bathrooms: data.bathrooms,
        facilities: data.amenities,
        image_url: data.images[data.mainImageIndex] || null,
        image_urls: data.images,
        property_type: data.propertyType,
        access_type: data.accessType,
        daily_price: data.dailyPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerListings"] });
      toast.success("Boendet har skapats och väntar på godkännande! 🎉");
      supabase.functions.invoke("admin-notifications", {
        body: {
          type: "listing_created",
          data: { name: data.name, destination: data.city, country: data.country, capacity: data.guests },
        },
      }).catch(console.error);
      onComplete();
    },
    onError: () => toast.error("Kunde inte skapa boendet. Försök igen."),
  });

  const canProceed = (): boolean => {
    switch (slide) {
      case 1: return !!data.propertyType;
      case 2: return !!data.accessType;
      case 3: return !!data.street && !!data.city && !!data.country;
      case 4: return data.guests >= 1;
      case 7: return data.images.length > 0;
      case 8: return data.name.trim().length > 0;
      case 11: return data.dailyPrice > 0;
      default: return true;
    }
  };

  const getStepFromSlide = (s: number) => {
    if (s <= 4) return 1;
    if (s <= 9) return 2;
    return 3;
  };

  const progress = ((slide + 1) / TOTAL_SLIDES) * 100;

  const renderSlide = () => {
    const stepProps = { data, updateData };
    switch (slide) {
      case 0:
        return (
          <StepIntro
            step={1}
            title="Berätta om ditt boende"
            description="I det här steget kommer vi att fråga dig vilken typ av boende du har och om gäster kommer att boka hela boendet eller bara ett rum. Informera oss om platsen och hur många gäster du kan ta emot."
          />
        );
      case 1: return <PropertyTypeStep {...stepProps} />;
      case 2: return <AccessTypeStep {...stepProps} />;
      case 3: return <AddressStep {...stepProps} />;
      case 4: return <BasicInfoStep {...stepProps} />;
      case 5:
        return (
          <StepIntro
            step={2}
            title="Få ditt boende att sticka ut"
            description="I det här steget kommer du att lägga till några av de bekvämligheter ditt boende erbjuder, plus fem eller fler foton. Sedan kommer du att döpa ditt boende och skriva en beskrivning."
          />
        );
      case 6: return <AmenitiesStep {...stepProps} />;
      case 7: return <PhotosStep {...stepProps} partnerId={partnerId} />;
      case 8: return <NameStep {...stepProps} />;
      case 9: return <DescriptionStep {...stepProps} />;
      case 10:
        return (
          <StepIntro
            step={3}
            title="Avsluta och publicera"
            description="Slutligen anger du priset för ditt boende. Sedan publicerar du din annons."
          />
        );
      case 11: return <PriceStep {...stepProps} />;
      case 12: return <PublishStep {...stepProps} isSubmitting={createMutation.isPending} />;
      default: return null;
    }
  };

  const isLastSlide = slide === TOTAL_SLIDES - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
        <img src={studentresorLogo} alt="Studentresor" className="h-5 opacity-70" />
        <div className="w-10" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted shrink-0">
        <div
          className="h-full bg-ocean transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-full flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderSlide()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {slide > 0 ? (
            <Button variant="ghost" onClick={goBack} className="underline text-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" /> Tillbaka
            </Button>
          ) : (
            <div />
          )}
          {isLastSlide ? (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="bg-ocean hover:bg-ocean/90 text-white px-8 py-2.5 rounded-lg text-base font-semibold"
            >
              {createMutation.isPending ? "Publicerar..." : "Publicera"}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="bg-ocean hover:bg-ocean/90 text-white px-8 py-2.5 rounded-lg text-base font-semibold"
            >
              Nästa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

function StepIntro({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-start justify-center py-8">
      <span className="text-sm font-semibold text-ocean uppercase tracking-wider mb-3">Steg {step}</span>
      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-5 leading-tight">{title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed max-w-md">{description}</p>
    </div>
  );
}
