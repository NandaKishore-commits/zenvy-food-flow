import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Payments service.
 *
 * The current implementation is a SIMULATED gateway: pressing "Pay" just
 * inserts an unpaid row, asks an edge function to flip it to paid (or
 * intentionally fail for ~10% of card payments), and confirms the order.
 *
 * The public surface (`initiatePayment`, `getPaymentForOrder`) is the same
 * shape we'd need for a real provider — to swap in Stripe/Paddle later,
 * change ONLY the body of `initiatePayment` so it redirects to a hosted
 * checkout and let the webhook update the row. Nothing else has to change.
 */

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export interface InitiatePaymentInput {
  orderId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
}

export interface PaymentResult {
  payment: PaymentRow;
  success: boolean;
}

function logError(scope: string, error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[payments:${scope}]`, error);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[payments] error (${scope})`);
  }
}

/**
 * Simulated payment flow:
 *   1. Insert payment row with status='unpaid' (RLS enforces ownership).
 *   2. Call `update-order-status` edge function which, for COD, marks paid
 *      and confirms the order; for UPI/Card, randomly succeeds (~90%).
 *   3. Return the resulting row.
 */
export async function initiatePayment(
  input: InitiatePaymentInput,
): Promise<PaymentResult> {
  const { orderId, userId, amount, method } = input;

  const { data: payment, error: insertErr } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      user_id: userId,
      amount,
      method,
      status: "unpaid",
    })
    .select()
    .single();

  if (insertErr || !payment) {
    logError("insert", insertErr);
    throw new Error("Could not start payment");
  }

  const { data, error } = await supabase.functions.invoke("update-order-status", {
    body: { action: "settle_payment", payment_id: payment.id },
  });
  if (error) {
    logError("settle", error);
    throw new Error("Payment processor unavailable");
  }

  return {
    payment: data.payment as PaymentRow,
    success: data.payment.status === "paid",
  };
}

export async function getPaymentForOrder(orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    logError("getForOrder", error);
    return null;
  }
  return data ?? null;
}