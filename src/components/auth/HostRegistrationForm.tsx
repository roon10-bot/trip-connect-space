import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, User, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const individualSchema = z.object({
  firstName: z.string().trim().min(1, "Förnamn krävs"),
  lastName: z.string().trim().min(1, "Efternamn krävs"),
  email: z.string().email("Ange en giltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
  phone: z.string().trim().min(1, "Telefonnummer krävs"),
  personalId: z.string().optional(),
  address: z.string().trim().min(1, "Adress krävs"),
  city: z.string().trim().min(1, "Stad krävs"),
  country: z.string().trim().min(1, "Land krävs"),
  iban: z.string().trim().min(1, "IBAN krävs"),
  bankName: z.string().trim().min(1, "Bankens namn krävs"),
  bankAddress: z.string().optional(),
  certifyRentalRights: z.literal(true, { errorMap: () => ({ message: "Du måste intyga detta" }) }),
  certifyLocalTaxes: z.literal(true, { errorMap: () => ({ message: "Du måste intyga detta" }) }),
});

const companySchema = z.object({
  companyName: z.string().trim().min(1, "Företagsnamn krävs"),
  organizationNumber: z.string().trim().min(1, "Organisationsnummer krävs"),
  contactPerson: z.string().trim().min(1, "Kontaktperson krävs"),
  email: z.string().email("Ange en giltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
  phone: z.string().trim().min(1, "Telefonnummer krävs"),
  address: z.string().trim().min(1, "Företagsadress krävs"),
  city: z.string().trim().min(1, "Stad krävs"),
  country: z.string().trim().min(1, "Land krävs"),
  iban: z.string().trim().min(1, "IBAN krävs"),
  swift: z.string().trim().min(1, "SWIFT krävs"),
  currency: z.string().trim().min(1, "Valuta krävs"),
  certifyCompanyAuthority: z.literal(true, { errorMap: () => ({ message: "Du måste intyga detta" }) }),
});

export type IndividualFormData = z.infer<typeof individualSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;

interface HostRegistrationFormProps {
  onSubmitIndividual: (data: IndividualFormData) => void;
  onSubmitCompany: (data: CompanyFormData) => void;
  isLoading: boolean;
}

type HostType = null | "individual" | "company";

export const HostRegistrationForm = ({
  onSubmitIndividual,
  onSubmitCompany,
  isLoading,
}: HostRegistrationFormProps) => {
  const [hostType, setHostType] = useState<HostType>(null);

  if (!hostType) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-2">
          <p className="text-muted-foreground text-sm">Välj typ av värd</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setHostType("individual")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <User className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium text-foreground">Privatperson</span>
          </button>

          <button
            type="button"
            onClick={() => setHostType("company")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-medium text-foreground">Företag</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {hostType === "individual" ? (
        <IndividualForm
          key="individual"
          onSubmit={onSubmitIndividual}
          onBack={() => setHostType(null)}
          isLoading={isLoading}
        />
      ) : (
        <CompanyForm
          key="company"
          onSubmit={onSubmitCompany}
          onBack={() => setHostType(null)}
          isLoading={isLoading}
        />
      )}
    </AnimatePresence>
  );
};

/* ─── Individual Form ─── */
const IndividualForm = ({
  onSubmit,
  onBack,
  isLoading,
}: {
  onSubmit: (data: IndividualFormData) => void;
  onBack: () => void;
  isLoading: boolean;
}) => {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<IndividualFormData>({
    resolver: zodResolver(individualSchema),
  });

  const goToStep2 = async () => {
    const valid = await trigger(["firstName", "lastName", "email", "password", "phone", "personalId", "address", "city", "country"]);
    if (valid) setStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <button
        type="button"
        onClick={step === 1 ? onBack : () => setStep(1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 1 ? "Tillbaka" : "Föregående steg"}
      </button>

      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Privatperson</h3>
        <span className="ml-auto text-xs text-muted-foreground">Steg {step} av 2</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Förnamn" id="firstName" register={register} error={errors.firstName} />
              <FieldInput label="Efternamn" id="lastName" register={register} error={errors.lastName} />
            </div>
            <FieldInput label="E-post" id="email" type="email" register={register} error={errors.email} />
            <FieldInput label="Lösenord" id="password" type="password" register={register} error={errors.password} placeholder="Minst 8 tecken" />
            <FieldInput label="Telefon" id="phone" register={register} error={errors.phone} />
            <FieldInput label="Personnummer / ID-nummer (valfritt)" id="personalId" register={register} error={errors.personalId} />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Stad" id="city" register={register} error={errors.city} />
              <FieldInput label="Land" id="country" register={register} error={errors.country} />
            </div>
            <FieldInput label="Adress" id="address" register={register} error={errors.address} />

            <Button type="button" onClick={goToStep2} className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold">
              Fortsätt <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-foreground">Betalningsinformation</p>
            <FieldInput label="IBAN" id="iban" register={register} error={errors.iban} />
            <FieldInput label="Bankens namn" id="bankName" register={register} error={errors.bankName} />
            <FieldInput label="Bankens adress (valfritt)" id="bankAddress" register={register} error={errors.bankAddress} />

            <div className="pt-2 space-y-3">
              <p className="text-sm font-medium text-foreground">Juridiskt</p>
              <CheckboxField
                id="certifyRentalRights"
                label="Jag intygar att jag har rätt att hyra ut boendet"
                register={register}
                error={errors.certifyRentalRights}
              />
              <CheckboxField
                id="certifyLocalTaxes"
                label="Jag ansvarar för lokala skatter"
                register={register}
                error={errors.certifyLocalTaxes}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Skapa värdkonto"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Genom att skapa konto godkänner du våra{" "}
              <Link to="/kontovillkor" className="underline hover:text-foreground">användarvillkor</Link>{" "}
              och{" "}
              <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">integritetspolicy</Link>.
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

/* ─── Company Form ─── */
const CompanyForm = ({
  onSubmit,
  onBack,
  isLoading,
}: {
  onSubmit: (data: CompanyFormData) => void;
  onBack: () => void;
  isLoading: boolean;
}) => {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const goToStep2 = async () => {
    const valid = await trigger(["companyName", "organizationNumber", "contactPerson", "email", "password", "phone", "address", "city", "country"]);
    if (valid) setStep(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <button
        type="button"
        onClick={step === 1 ? onBack : () => setStep(1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === 1 ? "Tillbaka" : "Föregående steg"}
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Företag</h3>
        <span className="ml-auto text-xs text-muted-foreground">Steg {step} av 2</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <FieldInput label="Företagsnamn" id="companyName" register={register} error={errors.companyName} />
            <FieldInput label="Organisationsnummer / OIB" id="organizationNumber" register={register} error={errors.organizationNumber} />
            <FieldInput label="Kontaktperson" id="contactPerson" register={register} error={errors.contactPerson} />
            <FieldInput label="E-post" id="email" type="email" register={register} error={errors.email} />
            <FieldInput label="Lösenord" id="password" type="password" register={register} error={errors.password} placeholder="Minst 8 tecken" />
            <FieldInput label="Telefon" id="phone" register={register} error={errors.phone} />
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Stad" id="city" register={register} error={errors.city} />
              <FieldInput label="Land" id="country" register={register} error={errors.country} />
            </div>
            <FieldInput label="Företagsadress" id="address" register={register} error={errors.address} />

            <Button type="button" onClick={goToStep2} className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold">
              Fortsätt <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm font-medium text-foreground">Betalningsinformation</p>
            <FieldInput label="IBAN" id="iban" register={register} error={errors.iban} />
            <FieldInput label="SWIFT" id="swift" register={register} error={errors.swift} />
            <FieldInput label="Valuta" id="currency" register={register} error={errors.currency} placeholder="t.ex. EUR, HRK, SEK" />

            <div className="pt-2 space-y-3">
              <p className="text-sm font-medium text-foreground">Juridiskt</p>
              <CheckboxField
                id="certifyCompanyAuthority"
                label="Jag är behörig att representera företaget"
                register={register}
                error={errors.certifyCompanyAuthority}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-ocean hover:opacity-90 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Skapa företagskonto"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Genom att skapa konto godkänner du våra{" "}
              <Link to="/kontovillkor" className="underline hover:text-foreground">användarvillkor</Link>{" "}
              och{" "}
              <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">integritetspolicy</Link>.
            </p>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};

/* ─── Shared field helpers ─── */
const FieldInput = ({
  label,
  id,
  type = "text",
  placeholder,
  register,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  register: any;
  error?: any;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm">{label}</Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      {...register(id)}
      className="h-11"
    />
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);

const CheckboxField = ({
  id,
  label,
  register,
  error,
}: {
  id: string;
  label: string;
  register: any;
  error?: any;
}) => (
  <div className="space-y-1">
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="checkbox" {...register(id)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
    {error && <p className="text-xs text-destructive">{error.message}</p>}
  </div>
);
