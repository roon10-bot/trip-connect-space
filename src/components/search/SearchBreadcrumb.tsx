import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBreadcrumbProps {
  currentStep: number;
}

const steps = [
  { label: "Välj boende", step: 1 },
  { label: "Välj flyg", step: 2 },
  { label: "Granska ditt paket", step: 3 },
];

export const SearchBreadcrumb = ({ currentStep }: SearchBreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-0 py-4">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center">
          {/* Step circle + label */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2",
                s.step < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : s.step === currentStep
                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                    : "bg-background border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {s.step < currentStep ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                s.step
              )}
            </div>
            <span
              className={cn(
                "text-sm transition-colors whitespace-nowrap",
                s.step === currentStep
                  ? "text-foreground font-semibold"
                  : s.step < currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>

          {/* Connector line */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                "w-12 h-0.5 mx-3 transition-colors",
                s.step < currentStep ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </nav>
  );
};
