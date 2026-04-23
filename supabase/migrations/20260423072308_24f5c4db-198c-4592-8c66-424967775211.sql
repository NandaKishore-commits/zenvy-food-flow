
-- 2. Replace user cancel policy: allow only when status is 'placed' or 'confirmed'
DROP POLICY IF EXISTS "Users cancel own orders" ON public.orders;
CREATE POLICY "Users cancel own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('placed'::order_status, 'confirmed'::order_status)
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'::order_status
);

-- 3. Atomic cancel function: cancels order + reconciles payment
CREATE OR REPLACE FUNCTION public.cancel_my_order(_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order   public.orders;
  v_payment public.payments;
  v_new_pay public.payment_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  IF v_order.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_order.status NOT IN ('placed'::order_status, 'confirmed'::order_status) THEN
    RAISE EXCEPTION 'order can no longer be cancelled (status=%)', v_order.status;
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO v_order;

  -- Reconcile latest payment row (if any)
  SELECT * INTO v_payment
  FROM public.payments
  WHERE order_id = _order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_new_pay := CASE
      WHEN v_payment.status = 'paid'   THEN 'refunded'::payment_status
      WHEN v_payment.status = 'unpaid' THEN 'cancelled'::payment_status
      ELSE v_payment.status -- failed/refunded/cancelled stay as-is
    END;

    IF v_new_pay <> v_payment.status THEN
      UPDATE public.payments
      SET status = v_new_pay, updated_at = now()
      WHERE id = v_payment.id;
    END IF;
  END IF;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_my_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_my_order(uuid) TO authenticated;
