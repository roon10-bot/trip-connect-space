import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Maj", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dec",
];

interface MonthPickerProps {
  selected?: { year: number; month: number } | null;
  onSelect: (value: { year: number; month: number } | undefined) => void;
  availableMonths?: { year: number; month: number }[];
}

export const MonthPicker = ({ selected, onSelect, availableMonths }: MonthPickerProps) => {
  const currentDate = new Date();
  const [displayYear, setDisplayYear] = useState(selected?.year ?? currentDate.getFullYear());

  const isAvailable = (month: number) => {
    if (!availableMonths || availableMonths.length === 0) return true;
    return availableMonths.some((m) => m.year === displayYear && m.month === month);
  };

  const isSelected = (month: number) => {
    return selected?.year === displayYear && selected?.month === month;
  };

  const isPast = (month: number) => {
    const now = new Date();
    return displayYear < now.getFullYear() || 
      (displayYear === now.getFullYear() && month < now.getMonth());
  };

  return (
    <div className="p-3 w-[260px]">
      {/* Year nav */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDisplayYear((y) => y - 1)}
          disabled={displayYear <= currentDate.getFullYear()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{displayYear}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDisplayYear((y) => y + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2">
        {MONTH_NAMES.map((name, idx) => {
          const disabled = isPast(idx) || !isAvailable(idx);
          const active = isSelected(idx);
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => {
                if (active) {
                  onSelect(undefined);
                } else {
                  onSelect({ year: displayYear, month: idx });
                }
              }}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : disabled
                  ? "text-muted-foreground opacity-40 cursor-not-allowed"
                  : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
