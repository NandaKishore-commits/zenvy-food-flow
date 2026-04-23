
-- 1) Fix orders UPDATE: only allow self-cancellation, and prevent tampering with prices/status/etc via WITH CHECK
DROP POLICY IF EXISTS "Users update own orders" ON public.orders;

CREATE POLICY "Users cancel own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('placed', 'preparing'))
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'
);

-- 2) Remove direct client INSERT on orders/order_items — server-side edge function will own this path.
--    Admins can still manage via their existing ALL/UPDATE policies; an edge function with the service
--    role bypasses RLS for legitimate order placement.
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create own order items" ON public.order_items;

-- 3) Add UPDATE/DELETE protection on order_items (currently missing -> any authed user could write).
--    We deny user UPDATE/DELETE entirely; lifecycle is server-managed.
CREATE POLICY "No user updates on order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No user deletes on order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (false);

-- 4) Harden user_roles against self-promotion: explicit RESTRICTIVE policy that blocks any INSERT/UPDATE/DELETE
--    coming from a non-admin, regardless of any future PERMISSIVE policy that might be added.
CREATE POLICY "Only admins write roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
