/**
 * Payment calculation utilities
 * Converts payment plan values (percent or amount) to actual amounts in kronor
 */

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
 * @param value - The stored value (percent or amount)
 * @param type - Whether the value is a percentage or fixed amount
 * @param totalPrice - The total price to calculate percentage from
 * @returns The actual amount in kronor
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
 * @param paymentPlan - The payment plan with types
 * @param totalPrice - The total price for the booking
 * @returns Object with calculated amounts for each payment
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
 * @param value - The stored value
 * @param type - The payment type
 * @param totalPrice - Total price for percentage calculation
 * @returns Formatted string showing amount (and percentage if applicable)
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
