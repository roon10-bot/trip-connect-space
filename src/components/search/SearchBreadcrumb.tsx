import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBreadcrumbProps {
  currentStep: number;
}

const steps = [
  { label: "Välj din vistelse", step: 1 },
  { label: "Välj ditt flyg", step: 2 },
  { label: "Anpassa ditt paket", step: 3 },
];

export const SearchBreadcrumb = ({ currentStep }: SearchBreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-2 text-sm py-4">
      {steps.map((s, i) => (
        <div key={s.step} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground">›</span>}
          <span
            className={cn(
              "transition-colors",
              s.step === currentStep
                ? "text-foreground font-semibold underline underline-offset-4"
                : s.step < currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
          >
            {s.label}
          </span>
        </div>
      ))}
    </nav>
  );
};
