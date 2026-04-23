-- 1. Extend payment_status enum with refunded & cancelled
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cancelled';
