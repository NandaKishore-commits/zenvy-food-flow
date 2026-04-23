// Server-authoritative order placement.
// Computes prices from the live menu_items table and writes orders + order_items
// using the service role, so clients can never inject arbitrary prices.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingItem {
  menu_item_id: string;
  quantity: number;
}

interface PlaceOrderBody {
  restaurant_id: string;
  address_id?: string | null;
  notes?: string;
  delivery_fee?: number;
  items: IncomingItem[];
}

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return bad(405, "Method not allowed");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Authenticate caller using their JWT (function deploys with verify_jwt=false by default)
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return bad(401, "Missing authorization");

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return bad(401, "Invalid session");
  const userId = userData.user.id;

  // 2) Validate body
  let body: PlaceOrderBody;
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON");
  }

  if (!body?.restaurant_id || typeof body.restaurant_id !== "string") {
    return bad(400, "restaurant_id required");
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return bad(400, "items required");
  }
  if (body.items.length > 100) return bad(400, "Too many items");

  const cleanItems: IncomingItem[] = [];
  for (const it of body.items) {
    const qty = Number(it?.quantity);
    if (!it?.menu_item_id || typeof it.menu_item_id !== "string") {
      return bad(400, "Invalid menu_item_id");
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return bad(400, "Invalid quantity");
    }
    cleanItems.push({ menu_item_id: it.menu_item_id, quantity: qty });
  }

  // 3) Use service role to look up authoritative prices and write the order
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const ids = [...new Set(cleanItems.map((i) => i.menu_item_id))];
  const { data: menuRows, error: menuErr } = await admin
    .from("menu_items")
    .select("id, name, price, available, restaurant_id")
    .in("id", ids);

  if (menuErr) {
    console.error("[place-order] menu lookup failed");
    return bad(500, "Could not load menu");
  }
  if (!menuRows || menuRows.length !== ids.length) {
    return bad(400, "One or more items no longer exist");
  }

  // Every item must belong to the requested restaurant and be available
  for (const m of menuRows) {
    if (m.restaurant_id !== body.restaurant_id) {
      return bad(400, "Items must belong to a single restaurant");
    }
    if (!m.available) return bad(400, `Item unavailable: ${m.name}`);
  }

  const priceById = new Map(menuRows.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItemsPayload = cleanItems.map((i) => {
    const m = priceById.get(i.menu_item_id)!;
    const line = Number(m.price) * i.quantity;
    subtotal += line;
    return {
      menu_item_id: m.id,
      name_snapshot: m.name,
      price_snapshot: Number(m.price),
      quantity: i.quantity,
    };
  });

  // Server controls delivery fee policy. Ignore client value entirely.
  const delivery_fee = 0;
  const total = subtotal + delivery_fee;

  // Validate optional address belongs to the user
  let addressId: string | null = null;
  if (body.address_id) {
    const { data: addr } = await admin
      .from("addresses")
      .select("id, user_id")
      .eq("id", body.address_id)
      .maybeSingle();
    if (!addr || addr.user_id !== userId) return bad(400, "Invalid address");
    addressId = addr.id;
  }

  const notes = typeof body.notes === "string" ? body.notes.slice(0, 500) : null;

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      restaurant_id: body.restaurant_id,
      address_id: addressId,
      subtotal,
      delivery_fee,
      total,
      notes,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("[place-order] order insert failed");
    return bad(500, "Could not create order");
  }

  const lineItems = orderItemsPayload.map((i) => ({ ...i, order_id: order.id }));
  const { error: itemsErr } = await admin.from("order_items").insert(lineItems);
  if (itemsErr) {
    console.error("[place-order] items insert failed");
    await admin.from("orders").delete().eq("id", order.id);
    return bad(500, "Could not create order items");
  }

  return new Response(
    JSON.stringify({ order_id: order.id, subtotal, total }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});