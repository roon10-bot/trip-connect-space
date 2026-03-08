import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, User, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const individualSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  phone: z.string().trim().min(1, "Required"),
  personalId: z.string().optional(),
  address: z.string().trim().min(1, "Required"),
  city: z.string().trim().min(1, "Required"),
  country: z.string().trim().min(1, "Required"),
  iban: z.string().trim().min(1, "Required"),
  bankName: z.string().trim().min(1, "Required"),
  bankAddress: z.string().optional(),
  certifyRentalRights: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
  certifyLocalTaxes: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Required"),
  organizationNumber: z.string().trim().min(1, "Required"),
  contactPerson: z.string().trim().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  phone: z.string().trim().min(1, "Required"),
  address: z.string().trim().min(1, "Required"),
  city: z.string().trim().min(1, "Required"),
  country: z.string().trim().min(1, "Required"),
  iban: z.string().trim().min(1, "Required"),
  swift: z.string().trim().min(1, "Required"),
  currency: z.string().trim().min(1, "Required"),
  certifyCompanyAuthority: z.literal(true, { errorMap: () => ({ message: "Required" }) }),
});

export type IndividualFormData = z.infer<typeof individualSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;

interface HostRegistrationFormProps {
  onSubmitIndividual: (data: IndividualFormData) => void;
  onSubmitCompany: (data: CompanyFormData) => void;
  isLoading: boolean;
}

type HostType = null | "individual" | "company";

export const HostRegistrationForm = ({ onSubmitIndividual, onSubmitCompany, isLoading }: HostRegistrationFormProps) => {
  const { t } = useTranslation();
  const [hostType, setHostType] = useState<HostType>(null);

  if (!hostType) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center mb-2"><p className="text-muted-foreground text-sm">{t("partner.hostReg.selectType")}</p></div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => setHostType("individual")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors"><User className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" /></div>
            <span className="font-medium text-foreground">{t("partner.hostReg.individual")}</span>
          </button>
          <button type="button" onClick={() => setHostType("company")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" /></div>
            <span className="font-medium text-foreground">{t("partner.hostReg.company")}</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {hostType === "individual" ? (
        <IndividualForm key="individual" onSubmit={onSubmitIndividual} onBack={() => setHostType(null)} isLoading={isLoading} />
      ) : (
        <CompanyForm key="company" onSubmit={onSubmitCompany} onBack={() => setHostType(null)} isLoading={isLoading} />
      )}
    </AnimatePresence>
  );
};

const IndividualForm = ({ onSubmit, onBack, isLoading }: { onSubmit: (data: IndividualFormData) => void; onBack: () => void; isLoading: boolean }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const { register, handleSubmit, trigger, formState: { errors } } = useForm<IndividualFormData>({ resolver: zodResolver(individualSchema) });

  const goToStep2 = async () => {
    const valid = await trigger(["firstName", "lastName", "email", "password", "phone", "personalId", "address", "city", "country"]);
    if (valid) setStep(2);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button type="button" onClick={step === 1 ? onBack : () => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {step === 1 ? t("partner.hostReg.back") : t("partner.hostReg.prevStep")}
      </button>
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">{t("partner.hostReg.individual")}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t("partner.hostReg.stepOf", { step })}</span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label={t("partner.hostReg.firstName")} id="firstName" register={register} error={errors.firstName} />
              <FieldInput label={t("partner.hostReg.lastName")} id="lastName" register={register} error={errors.lastName} />
            </div>
            <FieldInput label={t("partner.hostReg.email")} id="email" type="email" register={register} error={errors.email} />
            <FieldInput label={t("partner.hostReg.password")} id="password" type="password" register={register} error={errors.password} placeholder={t("partner.hostReg.minChars")} />
            <FieldInput label={t("partner.hostReg.phone")} id="phone" register={register} error={errors.phone} />
            <FieldInput label={t("partner.hostReg.personalId")} id="personalId" register={register} error={errors.personalId} />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label={t("partner.hostReg.city")} id="city" register={register} error={errors.city} />
              <FieldInput label={t("partner.hostReg.country")} id="country" register={register} error={errors.country} />
            </div>
            <FieldInput label={t("partner.hostReg.address")} id="address" register={register} error={errors.address} />
            <Button type="button" onClick={goToStep2} className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold">
              {t("partner.hostReg.continue")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm font-medium text-foreground">{t("partner.hostReg.paymentInfo")}</p>
            <FieldInput label={t("partner.hostReg.iban")} id="iban" register={register} error={errors.iban} />
            <FieldInput label={t("partner.hostReg.bankName")} id="bankName" register={register} error={errors.bankName} />
            <FieldInput label={t("partner.hostReg.bankAddress")} id="bankAddress" register={register} error={errors.bankAddress} />
            <div className="pt-2 space-y-3">
              <p className="text-sm font-medium text-foreground">{t("partner.hostReg.legal")}</p>
              <CheckboxField id="certifyRentalRights" label={t("partner.hostReg.certifyRental")} register={register} error={errors.certifyRentalRights} />
              <CheckboxField id="certifyLocalTaxes" label={t("partner.hostReg.certifyTaxes")} register={register} error={errors.certifyLocalTaxes} />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("partner.hostReg.createHostAccount")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("partner.hostReg.termsAgree")}{" "}
              <Link to="/kontovillkor" className="underline hover:text-foreground">{t("partner.hostReg.termsLink")}</Link>{" "}
              {t("partner.hostReg.and")}{" "}
              <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">{t("partner.hostReg.privacyLink")}</Link>.
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

const CompanyForm = ({ onSubmit, onBack, isLoading }: { onSubmit: (data: CompanyFormData) => void; onBack: () => void; isLoading: boolean }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const { register, handleSubmit, trigger, formState: { errors } } = useForm<CompanyFormData>({ resolver: zodResolver(companySchema) });

  const goToStep2 = async () => {
    const valid = await trigger(["companyName", "organizationNumber", "contactPerson", "email", "password", "phone", "address", "city", "country"]);
    if (valid) setStep(2);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <button type="button" onClick={step === 1 ? onBack : () => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {step === 1 ? t("partner.hostReg.back") : t("partner.hostReg.prevStep")}
      </button>
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">{t("partner.hostReg.company")}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t("partner.hostReg.stepOf", { step })}</span>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <FieldInput label={t("partner.hostReg.companyName")} id="companyName" register={register} error={errors.companyName} />
            <FieldInput label={t("partner.hostReg.orgNumber")} id="organizationNumber" register={register} error={errors.organizationNumber} />
            <FieldInput label={t("partner.hostReg.contactPerson")} id="contactPerson" register={register} error={errors.contactPerson} />
            <FieldInput label={t("partner.hostReg.email")} id="email" type="email" register={register} error={errors.email} />
            <FieldInput label={t("partner.hostReg.password")} id="password" type="password" register={register} error={errors.password} placeholder={t("partner.hostReg.minChars")} />
            <FieldInput label={t("partner.hostReg.phone")} id="phone" register={register} error={errors.phone} />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label={t("partner.hostReg.city")} id="city" register={register} error={errors.city} />
              <FieldInput label={t("partner.hostReg.country")} id="country" register={register} error={errors.country} />
            </div>
            <FieldInput label={t("partner.hostReg.companyAddress")} id="address" register={register} error={errors.address} />
            <Button type="button" onClick={goToStep2} className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold">
              {t("partner.hostReg.continue")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm font-medium text-foreground">{t("partner.hostReg.paymentInfo")}</p>
            <FieldInput label={t("partner.hostReg.iban")} id="iban" register={register} error={errors.iban} />
            <FieldInput label={t("partner.hostReg.swift")} id="swift" register={register} error={errors.swift} />
            <FieldInput label={t("partner.hostReg.currency")} id="currency" register={register} error={errors.currency} placeholder={t("partner.hostReg.currencyPlaceholder")} />
            <div className="pt-2 space-y-3">
              <p className="text-sm font-medium text-foreground">{t("partner.hostReg.legal")}</p>
              <CheckboxField id="certifyCompanyAuthority" label={t("partner.hostReg.certifyAuthority")} register={register} error={errors.certifyCompanyAuthority} />
            </div>
            <Button type="submit" className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("partner.hostReg.createCompanyAccount")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("partner.hostReg.termsAgree")}{" "}
              <Link to="/kontovillkor" className="underline hover:text-foreground">{t("partner.hostReg.termsLink")}</Link>{" "}
              {t("partner.hostReg.and")}{" "}
              <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">{t("partner.hostReg.privacyLink")}</Link>.
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

const FieldInput = ({ label, id, type = "text", placeholder, register, error }: { label: string; id: string; type?: string; placeholder?: string; register: any; error?: any }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm">{label}</Label>
    <Input id={id} type={type} placeholder={placeholder} {...register(id)} className="h-11" />
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);

const CheckboxField = ({ id, label, register, error }: { id: string; label: string; register: any; error?: any }) => (
  <div className="space-y-1">
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" {...register(id)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);