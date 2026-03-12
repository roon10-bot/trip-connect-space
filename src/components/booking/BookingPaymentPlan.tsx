import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CreditCard, CalendarClock, CheckCircle2 } from "lucide-react";
import { generateAutoPaymentPlan, type AutoPaymentPlanItem } from "@/lib/paymentCalculations";

interface BookingPaymentPlanProps {
  totalPrice: number;
  departureDate: string;
}

export const BookingPaymentPlan = ({
  totalPrice,
  departureDate,
}: BookingPaymentPlanProps) => {
  if (totalPrice <= 0) return null;

  const now = new Date().toISOString();
  const plan = generateAutoPaymentPlan(departureDate, now, totalPrice);

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-primary" />
        Betalningsplan
      </h4>
      <div className="space-y-2">
        {plan.map((item, index) => (
          <PaymentPlanRow key={index} item={item} isFirst={index === 0} />
        ))}
      </div>
    </div>
  );
};

const PaymentPlanRow = ({
  item,
  isFirst,
}: {
  item: AutoPaymentPlanItem;
  isFirst: boolean;
}) => {
  const label = isFirst ? "Bokningsavgift" : item.type === "final_payment" || item.type === "full_payment" ? "Slutbetalning" : "Delbetalning 2";
  const dateLabel = isFirst
    ? "Betalas direkt"
    : item.date
      ? format(new Date(item.date), "d MMMM yyyy", { locale: sv })
      : "";

  return (
    <div className="flex items-start justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 font-medium">
          {isFirst ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {label}
          {item.percentLabel && (
            <span className="text-xs text-muted-foreground">({item.percentLabel})</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{dateLabel}</p>
      </div>
      <span className="font-semibold whitespace-nowrap">
        {item.amount.toLocaleString("sv-SE")} kr
      </span>
    </div>
  );
};
