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
  // Avoid leaking Postgres / Supabase internals (table names, columns, SQL state)
  // to the browser console. Only the high-level scope is surfaced; full details
  // would be sent to a server-side log sink (Sentry, Datadog, edge function) in
  // production.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[dataLayer:${scope}]`, error);
  } else {
    // eslint-disable-next-line no-console
    console.error(`[dataLayer] An unexpected error occurred (${scope})`);
  }
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

  // Supabase needs a concrete table name to type the chain; cast internally
  // and rely on PublicTable to keep the public API safe.
  let query: any = supabase.from(table as any).select(select, { count: "exact" });

  if (filters) {
    for (const [col, val] of Object.entries(filters)) {
      if (val === null) query = query.is(col, null);
      else query = query.eq(col, val);
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
  const { data, error } = await (supabase.from(table as any) as any)
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
  const { data, error } = await (supabase.from(table as any) as any)
    .insert(values)
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
  const { data, error } = await (supabase.from(table as any) as any)
    .update(values)
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
  const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
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
    quantity: number;
  }>;
  notes?: string;
}

/**
 * Place an order through the secure `place-order` edge function.
 * The client only sends `{ menu_item_id, quantity }` — prices, subtotal, total
 * and delivery fee are all computed server-side against the live menu so they
 * cannot be tampered with from the browser.
 */
export async function placeOrder(input: PlaceOrderInput) {
  const { data, error } = await supabase.functions.invoke("place-order", {
    body: {
      restaurant_id: input.restaurantId,
      address_id: input.addressId ?? null,
      notes: input.notes,
      items: input.items.map((i) => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
      })),
    },
  });
  if (error) {
    logError("placeOrder", error);
    throw new Error("Could not place order");
  }
  return data as { order_id: string; subtotal: number; total: number };
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