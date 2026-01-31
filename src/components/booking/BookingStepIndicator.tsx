import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingStepIndicatorProps {
  currentStep: number;
  totalSteps?: 3 | 4;
}

const stepsWithAccount = [
  { number: 1, title: "Skapa konto" },
  { number: 2, title: "Antal resenärer" },
  { number: 3, title: "Resenärinformation" },
  { number: 4, title: "Sammanfattning" },
];

const stepsWithoutAccount = [
  { number: 1, title: "Antal resenärer" },
  { number: 2, title: "Resenärinformation" },
  { number: 3, title: "Sammanfattning" },
];

export const BookingStepIndicator = ({ currentStep, totalSteps = 3 }: BookingStepIndicatorProps) => {
  const steps = totalSteps === 4 ? stepsWithAccount : stepsWithoutAccount;
  
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                currentStep === step.number
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : currentStep > step.number
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "hidden md:block text-sm font-medium transition-colors",
                currentStep === step.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-12 md:w-20 h-1 mx-2 md:mx-4 rounded-full transition-colors",
                currentStep > step.number ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
