// update-order-status edge function
// Two actions:
//   - settle_payment: simulate the payment processor for a given payment_id.
//                     COD always succeeds. UPI/Card succeed ~90% of the time.
//                     On success, the related order moves placed -> confirmed.
//   - advance:        admin-only manual status transition via the
//                     advance_order_status() database function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return bad(401, "Missing authorization");

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return bad(401, "Invalid session");
  const userId = userData.user.id;

  let body: {
    action?: string;
    payment_id?: string;
    order_id?: string;
    new_status?: string;
    client_hint?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON");
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // -------------------------------------------------------------- settle_payment
  if (body.action === "settle_payment") {
    if (!body.payment_id) return bad(400, "payment_id required");

    const { data: payment, error: pErr } = await admin
      .from("payments")
      .select("*, orders!inner(id, user_id, status)")
      .eq("id", body.payment_id)
      .maybeSingle();

    if (pErr || !payment) return bad(404, "Payment not found");
    if (payment.user_id !== userId) return bad(403, "Forbidden");
    if (payment.status !== "unpaid") {
      return new Response(JSON.stringify({ payment }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simulated outcome: COD always succeeds; UPI/Card succeed ~90%
    const succeeds = payment.method === "cod"
      ? true
      : Math.random() < 0.9;

    const newStatus = succeeds ? "paid" : "failed";
    // Trust nothing the client said about itself: clamp the hint length and
    // strip control chars before persisting it next to the simulator ref.
    const safeHint = typeof body.client_hint === "string"
      ? body.client_hint.replace(/[^\x20-\x7E]/g, "").slice(0, 40)
      : "";
    const providerRef = `sim_${crypto.randomUUID().slice(0, 12)}${
      safeHint ? `|${safeHint}` : ""
    }`;

    const { data: updated, error: uErr } = await admin
      .from("payments")
      .update({ status: newStatus, provider_ref: providerRef })
      .eq("id", payment.id)
      .select()
      .single();
    if (uErr || !updated) return bad(500, "Could not finalize payment");

    if (succeeds) {
      // Move order from 'placed' to 'confirmed' on successful payment.
      // For COD, leave at 'placed' until the admin confirms — but spec says
      // on success move to confirmed, so we apply to all methods.
      await admin
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", payment.order_id)
        .eq("status", "placed");
    }

    return new Response(JSON.stringify({ payment: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // -------------------------------------------------------------- advance (admin)
  if (body.action === "advance") {
    if (!body.order_id || !body.new_status) {
      return bad(400, "order_id and new_status required");
    }

    // has_role check is enforced inside the SQL function, but verify here too
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) return bad(403, "Admin only");

    const { data, error } = await admin.rpc("advance_order_status", {
      _order_id: body.order_id,
      _new_status: body.new_status,
    });
    if (error) return bad(400, error.message);

    return new Response(JSON.stringify({ order: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return bad(400, "Unknown action");
});