-- 1) Add 'confirmed' to order_status enum (between 'placed' and 'preparing')
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed' BEFORE 'preparing';

-- 2) Payments table
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'failed');
CREATE TYPE public.payment_method AS ENUM ('upi', 'card', 'cod');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  method public.payment_method NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'unpaid',
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users see their own payments
CREATE POLICY "Users view own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert a payment only for an order they own. Initial status must be unpaid.
CREATE POLICY "Users insert own payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'unpaid'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND o.user_id = auth.uid()
  )
);

-- No client updates / deletes (server-side only via service role / edge function)
CREATE POLICY "No user updates payments"
ON public.payments FOR UPDATE
TO authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "No user deletes payments"
ON public.payments FOR DELETE
TO authenticated
USING (false);

-- Admins
CREATE POLICY "Admins view all payments"
ON public.payments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage payments"
ON public.payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Realtime on orders so the Track Order page can subscribe
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 4) Admin-only function to advance order status linearly
CREATE OR REPLACE FUNCTION public.advance_order_status(_order_id uuid, _new_status public.order_status)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_allowed boolean := false;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  -- Allowed forward transitions (and cancel from early stages)
  v_allowed := (
    (v_order.status = 'placed'           AND _new_status IN ('confirmed', 'cancelled')) OR
    (v_order.status = 'confirmed'        AND _new_status IN ('preparing', 'cancelled')) OR
    (v_order.status = 'preparing'        AND _new_status IN ('out_for_delivery', 'cancelled')) OR
    (v_order.status = 'out_for_delivery' AND _new_status = 'delivered')
  );

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'invalid transition from % to %', v_order.status, _new_status;
  END IF;

  UPDATE public.orders SET status = _new_status, updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;