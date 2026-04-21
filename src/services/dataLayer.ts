import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Generic CRUD data-access layer for Supabase.
 *
 * Tables are typed against the auto-generated Database schema, so the table
 * name argument is restricted to actual public tables and the returned rows
 * carry the correct row type.
 */

export type PublicTable = keyof Database["public"]["Tables"];
export type Row<T extends PublicTable> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends PublicTable> = Database["public"]["Tables"][T]["Insert"];
export type Update<T extends PublicTable> = Database["public"]["Tables"][T]["Update"];

export interface QueryOptions {
  /** Equality filters: { column: value } */
  filters?: Record<string, string | number | boolean | null>;
  /** Order by column */
  orderBy?: { column: string; ascending?: boolean };
  /** 1-based page number */
  page?: number;
  /** Page size (default 20) */
  pageSize?: number;
  /** Free-text search (ILIKE on the given column) */
  search?: { column: string; term: string };
  /** Optional select string (defaults to "*"), supports nested joins like "*, menu_items(*)" */
  select?: string;
}

function logError(scope: string, error: unknown) {
  // Centralised logging hook — swap out for Sentry, etc.
  // eslint-disable-next-line no-console
  console.error(`[dataLayer:${scope}]`, error);
}

export async function getAll<T extends PublicTable>(
  table: T,
  opts: QueryOptions = {}
): Promise<{ data: Row<T>[]; count: number }> {
  const {
    filters,
    orderBy,
    page = 1,
    pageSize = 20,
    search,
    select = "*",
  } = opts;

  let query = supabase.from(table).select(select, { count: "exact" });

  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      if (val === null) query = query.is(col, null);
      else query = query.eq(col, val as never);
    }
  }
  if (search?.term) {
    query = query.ilike(search.column, `%${search.term}%`);
  }
  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    logError(`getAll:${table}`, error);
    throw error;
  }
  return { data: (data ?? []) as unknown as Row<T>[], count: count ?? 0 };
}

export async function getById<T extends PublicTable>(
  table: T,
  id: string,
  select = "*"
): Promise<Row<T> | null> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    logError(`getById:${table}`, error);
    throw error;
  }
  return (data as unknown as Row<T>) ?? null;
}

export async function createRecord<T extends PublicTable>(
  table: T,
  values: Insert<T>
): Promise<Row<T>> {
  const { data, error } = await supabase
    .from(table)
    .insert(values as never)
    .select()
    .single();
  if (error) {
    logError(`create:${table}`, error);
    throw error;
  }
  return data as unknown as Row<T>;
}

export async function updateRecord<T extends PublicTable>(
  table: T,
  id: string,
  values: Update<T>
): Promise<Row<T>> {
  const { data, error } = await supabase
    .from(table)
    .update(values as never)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    logError(`update:${table}`, error);
    throw error;
  }
  return data as unknown as Row<T>;
}

export async function deleteRecord<T extends PublicTable>(
  table: T,
  id: string
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) {
    logError(`delete:${table}`, error);
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Domain helpers built on top of the generic layer                    */
/* ------------------------------------------------------------------ */

export async function listRestaurants(opts: {
  search?: string;
  cuisine?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  return getAll("restaurants", {
    search: opts.search ? { column: "name", term: opts.search } : undefined,
    filters: opts.cuisine && opts.cuisine !== "All" ? { cuisine: opts.cuisine } : undefined,
    orderBy: { column: "featured", ascending: false },
    page: opts.page,
    pageSize: opts.pageSize ?? 50,
  });
}

export async function getRestaurantWithMenu(restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, menu_items(*)")
    .eq("id", restaurantId)
    .maybeSingle();
  if (error) {
    logError("getRestaurantWithMenu", error);
    throw error;
  }
  return data;
}

export interface PlaceOrderInput {
  userId: string;
  restaurantId: string;
  addressId?: string | null;
  items: Array<{
    menu_item_id: string;
    name_snapshot: string;
    price_snapshot: number;
    quantity: number;
  }>;
  deliveryFee?: number;
  notes?: string;
}

export async function placeOrder(input: PlaceOrderInput) {
  const subtotal = input.items.reduce(
    (sum, i) => sum + Number(i.price_snapshot) * i.quantity,
    0
  );
  const delivery_fee = input.deliveryFee ?? 0;
  const total = subtotal + delivery_fee;

  const order = await createRecord("orders", {
    user_id: input.userId,
    restaurant_id: input.restaurantId,
    address_id: input.addressId ?? null,
    subtotal,
    delivery_fee,
    total,
    notes: input.notes,
  });

  const lineItems = input.items.map((i) => ({ ...i, order_id: order.id }));
  const { error } = await supabase.from("order_items").insert(lineItems);
  if (error) {
    logError("placeOrder:items", error);
    // Best-effort rollback
    await deleteRecord("orders", order.id);
    throw error;
  }
  return order;
}

export async function listMyOrders(userId: string) {
  return getAll("orders", {
    filters: { user_id: userId },
    orderBy: { column: "created_at", ascending: false },
    pageSize: 50,
  });
}

export async function toggleFavorite(userId: string, restaurantId: string) {
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (existing) {
    await deleteRecord("favorites", existing.id);
    return false;
  }
  await createRecord("favorites", { user_id: userId, restaurant_id: restaurantId });
  return true;
}