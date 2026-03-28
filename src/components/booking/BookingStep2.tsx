import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, ArrowRight, UserRound, Tag, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TravelerInfo } from "@/pages/BookTrip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface BookingStep2Props {
  travelersInfo: TravelerInfo[];
  setTravelersInfo: (info: TravelerInfo[]) => void;
  pricePerPerson: number;
  onNext: () => void;
  onPrev: () => void;
}

export const BookingStep2 = ({
  travelersInfo,
  setTravelersInfo,
  pricePerPerson,
  onNext,
  onPrev,
}: BookingStep2Props) => {
  const { user } = useAuth();
  const isPrimaryLoggedIn = !!user;
  const [openDatePickers, setOpenDatePickers] = useState<Record<number, boolean>>({});
  const [discountInputs, setDiscountInputs] = useState<Record<number, string>>({});
  const [discountLoading, setDiscountLoading] = useState<Record<number, boolean>>({});
  const [discountErrors, setDiscountErrors] = useState<Record<number, string>>({});

  const updateField = (index: number, field: keyof TravelerInfo, value: string | Date | undefined) => {
    if (index === 0 && field === "email" && isPrimaryLoggedIn) return;
    const updated = [...travelersInfo];
    updated[index] = { ...updated[index], [field]: value };
    setTravelersInfo(updated);
  };

  const applyDiscount = async (index: number) => {
    const code = (discountInputs[index] || "").trim().toUpperCase();
    if (!code) return;

    setDiscountLoading((prev) => ({ ...prev, [index]: true }));
    setDiscountErrors((prev) => ({ ...prev, [index]: "" }));

    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("id, code, discount_percent, discount_amount, is_active, max_uses, current_uses, valid_from, valid_until, allowed_email")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Ogiltig rabattkod" }));
        return;
      }

      // Check if personal code matches traveler email
      const travelerEmail = travelersInfo[index].email?.toLowerCase().trim();
      if (data.allowed_email && data.allowed_email.toLowerCase() !== travelerEmail) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Denna kod är knuten till en annan e-postadress" }));
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Rabattkoden har förbrukats" }));
        return;
      }

      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Rabattkoden är inte aktiv ännu" }));
        return;
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Rabattkoden har gått ut" }));
        return;
      }

      // Check if this email has already used this code (per-email usage tracking)
      if (travelerEmail) {
        const { data: existingUse } = await supabase
          .from("discount_code_uses")
          .select("id")
          .eq("discount_code_id", data.id)
          .eq("email", travelerEmail)
          .maybeSingle();

        if (existingUse) {
          setDiscountErrors((prev) => ({ ...prev, [index]: "Redan använd med denna e-postadress" }));
          return;
        }
      }

      // Check if another traveler in the same booking already uses this code with the same email
      const duplicateInBooking = travelersInfo.some(
        (t, i) => i !== index && t.discount?.codeId === data.id && t.email?.toLowerCase().trim() === travelerEmail
      );
      if (duplicateInBooking) {
        setDiscountErrors((prev) => ({ ...prev, [index]: "Denna kod används redan av en annan resenär med samma e-post" }));
        return;
      }

      // Calculate discount amount
      let calculatedAmount = 0;
      if (data.discount_percent) {
        calculatedAmount = Math.round(pricePerPerson * (data.discount_percent / 100));
      } else if (data.discount_amount) {
        calculatedAmount = Math.min(Number(data.discount_amount), pricePerPerson);
      }

      const updated = [...travelersInfo];
      updated[index] = {
        ...updated[index],
        discount: {
          codeId: data.id,
          code: data.code,
          percent: data.discount_percent,
          amount: data.discount_amount ? Number(data.discount_amount) : null,
          calculatedAmount,
        },
      };
      setTravelersInfo(updated);
      setDiscountInputs((prev) => ({ ...prev, [index]: "" }));
    } finally {
      setDiscountLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const removeDiscount = (index: number) => {
    const updated = [...travelersInfo];
    updated[index] = { ...updated[index], discount: null };
    setTravelersInfo(updated);
    setDiscountErrors((prev) => ({ ...prev, [index]: "" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {travelersInfo.map((traveler, index) => (
        <Card key={index} className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <UserRound className="w-6 h-6 text-primary" />
              {travelersInfo.length > 1
                ? `Resenär ${index + 1} av ${travelersInfo.length}`
                : "Resenärinformation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor={`firstName-${index}`}>
                  Förnamn <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
                </Label>
                <Input
                  id={`firstName-${index}`}
                  placeholder="Förnamn"
                  value={traveler.firstName}
                  onChange={(e) => updateField(index, "firstName", e.target.value)}
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor={`lastName-${index}`}>
                  Efternamn <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-1">(samma som i passet)</span>
                </Label>
                <Input
                  id={`lastName-${index}`}
                  placeholder="Efternamn"
                  value={traveler.lastName}
                  onChange={(e) => updateField(index, "lastName", e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor={`email-${index}`}>
                E-post <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`email-${index}`}
                type="email"
                placeholder="din@email.se"
                value={traveler.email}
                onChange={(e) => updateField(index, "email", e.target.value)}
                readOnly={index === 0 && isPrimaryLoggedIn}
                className={index === 0 && isPrimaryLoggedIn ? "bg-muted cursor-not-allowed" : ""}
              />
              {index === 0 && isPrimaryLoggedIn && (
                <p className="text-xs text-muted-foreground">E-postadressen är kopplad till ditt konto</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Birth Date */}
              <div className="space-y-2">
                <Label>
                  Födelsedatum <span className="text-destructive">*</span>
                </Label>
                <Popover
                  open={openDatePickers[index] || false}
                  onOpenChange={(open) => setOpenDatePickers((prev) => ({ ...prev, [index]: open }))}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !traveler.birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {traveler.birthDate
                        ? format(traveler.birthDate, "PPP", { locale: sv })
                        : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={traveler.birthDate}
                      onSelect={(date) => {
                        updateField(index, "birthDate", date);
                        setOpenDatePickers((prev) => ({ ...prev, [index]: false }));
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                      captionLayout="dropdown"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                    />
                    {traveler.birthDate && (() => {
                      const eighteenYearsAgo = new Date();
                      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
                      return traveler.birthDate > eighteenYearsAgo;
                    })() && (
                      <p className="text-xs text-destructive px-3 pb-2">Resenären måste vara minst 18 år</p>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor={`phone-${index}`}>
                  Telefonnummer <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`phone-${index}`}
                  type="tel"
                  placeholder="070-123 45 67"
                  value={traveler.phone}
                  onChange={(e) => updateField(index, "phone", e.target.value)}
                />
              </div>
            </div>

            {/* Departure Location (read-only, set from trip) */}
            <div className="space-y-2">
              <Label>Avgångsort</Label>
              <Input
                value={traveler.departureLocation}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Avgångsorten är bestämd av resan</p>
            </div>

            {/* Discount Code */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Rabattkod <span className="text-xs text-muted-foreground">(valfritt)</span>
              </Label>
              {traveler.discount ? (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary text-sm">
                    {traveler.discount.code}
                    {traveler.discount.percent && ` (-${traveler.discount.percent}%)`}
                    {traveler.discount.amount && ` (-${traveler.discount.amount} kr)`}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto mr-2">
                    -{traveler.discount.calculatedAmount.toLocaleString("sv-SE")} kr
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDiscount(index)}
                    className="h-7 w-7"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ange rabattkod"
                      value={discountInputs[index] || ""}
                      onChange={(e) =>
                        setDiscountInputs((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && applyDiscount(index)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => applyDiscount(index)}
                      variant="secondary"
                      disabled={discountLoading[index]}
                      size="sm"
                      className="px-4"
                    >
                      {discountLoading[index] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Tillämpa"
                      )}
                    </Button>
                  </div>
                  {discountErrors[index] && (
                    <p className="text-xs text-destructive">{discountErrors[index]}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="flex-1 h-14"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="flex-1 bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
        >
          Fortsätt
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
