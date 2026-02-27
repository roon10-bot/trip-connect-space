/**
 * Payment calculation utilities
 * Converts payment plan values (percent or amount) to actual amounts in kronor
 */

/**
 * Calculate Splitveckan price per person using the component-based formula:
 * ((accommodation / persons) + flight + extras) × 1.20
 */
export function calculateSplitPricePerPerson(
  basePriceAccommodation: number,
  basePriceFlight: number,
  basePriceExtras: number,
  persons: number
): number {
  if (persons <= 0) return 0;
  return Math.ceil(((basePriceAccommodation / persons) + basePriceFlight + basePriceExtras) * 1.20);
}

/**
 * Legacy helper: calculate Splitveckan price per person from trip object.
 * Falls back to old formula if sub-fields are missing.
 */
export function getSplitPricePerPerson(
  trip: {
    base_price?: number | null;
    base_price_accommodation?: number;
    base_price_flight?: number;
    base_price_extras?: number;
  },
  persons: number
): number {
  const accommodation = Number((trip as any).base_price_accommodation) || 0;
  const flight = Number((trip as any).base_price_flight) || 0;
  const extras = Number((trip as any).base_price_extras) || 0;

  if (accommodation > 0 || flight > 0 || extras > 0) {
    return calculateSplitPricePerPerson(accommodation, flight, extras, persons);
  }
  // Fallback for old data without sub-fields
  if (trip.base_price && persons > 0) {
    return Math.ceil((Number(trip.base_price) * 1.20) / persons);
  }
  return 0;
}

export type PaymentValueType = "percent" | "amount";

export interface PaymentPlanItem {
  amount: number;
  type: PaymentValueType;
  date: string | null;
}

export interface PaymentPlan {
  first: PaymentPlanItem;
  second: PaymentPlanItem;
  final: PaymentPlanItem;
}

/**
 * Calculate the actual amount in kronor for a payment
 */
export function calculatePaymentAmount(
  value: number,
  type: PaymentValueType,
  totalPrice: number
): number {
  if (type === "percent") {
    return Math.ceil((value / 100) * totalPrice);
  }
  return value;
}

/**
 * Calculate all payment plan amounts
 */
export function calculatePaymentPlanAmounts(
  paymentPlan: PaymentPlan,
  totalPrice: number
): {
  first: number;
  second: number;
  final: number;
  total: number;
} {
  const firstAmount = calculatePaymentAmount(
    paymentPlan.first.amount,
    paymentPlan.first.type,
    totalPrice
  );
  
  const secondAmount = calculatePaymentAmount(
    paymentPlan.second.amount,
    paymentPlan.second.type,
    totalPrice
  );
  
  const finalAmount = calculatePaymentAmount(
    paymentPlan.final.amount,
    paymentPlan.final.type,
    totalPrice
  );

  return {
    first: firstAmount,
    second: secondAmount,
    final: finalAmount,
    total: firstAmount + secondAmount + finalAmount,
  };
}

/**
 * Format payment display with optional percentage info
 */
export function formatPaymentDisplay(
  value: number,
  type: PaymentValueType,
  totalPrice: number
): string {
  const amount = calculatePaymentAmount(value, type, totalPrice);
  const formattedAmount = amount.toLocaleString("sv-SE");
  
  if (type === "percent") {
    return `${formattedAmount} kr (${value}%)`;
  }
  return `${formattedAmount} kr`;
}

/**
 * Check if a trip has a manually configured payment plan
 */
export function hasManualPaymentPlan(trip: {
  first_payment_amount?: number;
  second_payment_amount?: number;
  final_payment_amount?: number;
}): boolean {
  return (
    (trip.first_payment_amount || 0) > 0 ||
    (trip.second_payment_amount || 0) > 0 ||
    (trip.final_payment_amount || 0) > 0
  );
}

/**
 * Auto-generated payment plan item
 */
export interface AutoPaymentPlanItem {
  type: "first_payment" | "second_payment" | "final_payment" | "full_payment";
  label: string;
  amount: number;
  date: string;
  percentLabel?: string;
}

/**
 * Generate an automatic payment plan based on days between booking and departure.
 * 
 * Rules:
 * - >120 days: 30% within 48h, 35% at 90 days before, 35% at 30 days before
 * - 61–120 days: 50% within 48h, 50% at 30 days before
 * - ≤60 days: 100% within 48h
 * 
 * If a calculated due date has already passed, it falls back to 48h from now.
 */
export function generateAutoPaymentPlan(
  departureDate: string,
  bookingDate: string,
  totalPrice: number
): AutoPaymentPlanItem[] {
  const departure = new Date(departureDate);
  const booking = new Date(bookingDate);
  const now = new Date();

  const daysUntilDeparture = Math.floor(
    (departure.getTime() - booking.getTime()) / (1000 * 60 * 60 * 24)
  );

  const hours48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const toDateStr = (d: Date) => d.toISOString().split("T")[0];

  // Ensure a due date hasn't passed; if so, use 48h from now
  const ensureFuture = (d: Date): Date => {
    return d <= now ? hours48 : d;
  };

  const day90Before = new Date(departure);
  day90Before.setDate(day90Before.getDate() - 90);

  const day30Before = new Date(departure);
  day30Before.setDate(day30Before.getDate() - 30);

  if (daysUntilDeparture > 120) {
    // Scenario 1: 30% / 35% / 35%
    const first = Math.ceil(totalPrice * 0.30);
    const second = Math.ceil(totalPrice * 0.35);
    const final_ = totalPrice - first - second;
    return [
      {
        type: "first_payment",
        label: "Delbetalning 1 (30%)",
        amount: first,
        date: toDateStr(ensureFuture(hours48)),
        percentLabel: "30%",
      },
      {
        type: "second_payment",
        label: "Delbetalning 2 (35%)",
        amount: second,
        date: toDateStr(ensureFuture(day90Before)),
        percentLabel: "35%",
      },
      {
        type: "final_payment",
        label: "Slutbetalning (35%)",
        amount: final_,
        date: toDateStr(ensureFuture(day30Before)),
        percentLabel: "35%",
      },
    ];
  } else if (daysUntilDeparture >= 61) {
    // Scenario 2: 50% / 50%
    const first = Math.ceil(totalPrice * 0.50);
    const final_ = totalPrice - first;
    return [
      {
        type: "first_payment",
        label: "Delbetalning 1 (50%)",
        amount: first,
        date: toDateStr(ensureFuture(hours48)),
        percentLabel: "50%",
      },
      {
        type: "final_payment",
        label: "Slutbetalning (50%)",
        amount: final_,
        date: toDateStr(ensureFuture(day30Before)),
        percentLabel: "50%",
      },
    ];
  } else {
    // Scenario 3: 100% within 48h
    return [
      {
        type: "full_payment",
        label: "Fullständig betalning",
        amount: totalPrice,
        date: toDateStr(ensureFuture(hours48)),
      },
    ];
  }
}

/**
 * Build a resolved payment plan from trip data, with auto-generation fallback.
 * Returns a unified array of payment plan items regardless of source.
 */
export function resolvePaymentPlan(
  trip: {
    departure_date: string;
    first_payment_amount?: number;
    first_payment_type?: PaymentValueType;
    first_payment_date?: string | null;
    second_payment_amount?: number;
    second_payment_type?: PaymentValueType;
    second_payment_date?: string | null;
    final_payment_amount?: number;
    final_payment_type?: PaymentValueType;
    final_payment_date?: string | null;
  },
  totalPrice: number,
  bookingCreatedAt: string
): AutoPaymentPlanItem[] {
  if (hasManualPaymentPlan(trip)) {
    // Use the manual plan
    const items: AutoPaymentPlanItem[] = [];
    if ((trip.first_payment_amount || 0) > 0) {
      const amt = calculatePaymentAmount(
        trip.first_payment_amount!,
        trip.first_payment_type || "amount",
        totalPrice
      );
      items.push({
        type: "first_payment",
        label: trip.first_payment_type === "percent"
          ? `Delbetalning 1 (${trip.first_payment_amount}%)`
          : "Delbetalning 1",
        amount: amt,
        date: trip.first_payment_date || "",
      });
    }
    if ((trip.second_payment_amount || 0) > 0) {
      const amt = calculatePaymentAmount(
        trip.second_payment_amount!,
        trip.second_payment_type || "amount",
        totalPrice
      );
      items.push({
        type: "second_payment",
        label: trip.second_payment_type === "percent"
          ? `Delbetalning 2 (${trip.second_payment_amount}%)`
          : "Delbetalning 2",
        amount: amt,
        date: trip.second_payment_date || "",
      });
    }
    if ((trip.final_payment_amount || 0) > 0) {
      const amt = calculatePaymentAmount(
        trip.final_payment_amount!,
        trip.final_payment_type || "amount",
        totalPrice
      );
      items.push({
        type: "final_payment",
        label: trip.final_payment_type === "percent"
          ? `Slutbetalning (${trip.final_payment_amount}%)`
          : "Slutbetalning",
        amount: amt,
        date: trip.final_payment_date || "",
      });
    }
    return items;
  }

  // No manual plan → auto-generate
  return generateAutoPaymentPlan(trip.departure_date, bookingCreatedAt, totalPrice);
}
