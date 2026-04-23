import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[];
  restaurants: { name: string; image_url: string | null } | null;
};

function logError(scope: string, e: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[orders:${scope}]`, e);
  }
}

export async function listMyOrdersWithItems(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    logError("list", error);
    throw error;
  }
  return (data ?? []) as OrderWithItems[];
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, image_url)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) {
    logError("getOne", error);
    throw error;
  }
  return (data as OrderWithItems) ?? null;
}

export async function listAllOrdersAdmin(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name, image_url)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    logError("listAdmin", error);
    throw error;
  }
  return (data ?? []) as OrderWithItems[];
}

/** Admin-only: invoke edge function to advance status. */
export async function advanceOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { data, error } = await supabase.functions.invoke("update-order-status", {
    body: { action: "advance", order_id: orderId, new_status: newStatus },
  });
  if (error) {
    logError("advance", error);
    throw new Error("Could not update order status");
  }
  return data?.order as OrderRow;
}

/**
 * User-facing cancel: allowed only while the order is 'placed' or 'confirmed'.
 * Atomically cancels the order AND reconciles the linked payment
 * (paid -> refunded, unpaid -> cancelled) via a SECURITY DEFINER RPC.
 */
export async function cancelMyOrder(orderId: string): Promise<OrderRow> {
  const { data, error } = await supabase.rpc("cancel_my_order", {
    _order_id: orderId,
  });
  if (error) {
    logError("cancel", error);
    const msg = /no longer be cancelled/i.test(error.message)
      ? "This order can no longer be cancelled."
      : "Could not cancel order";
    throw new Error(msg);
  }
  return data as OrderRow;
}