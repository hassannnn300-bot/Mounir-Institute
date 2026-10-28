-- Run once in the Supabase SQL Editor after deploying the refunds change (28 October 2026).
-- Lets a reservation be marked refunded, which frees its place, and stores the Stripe ids behind each payment.
alter table public.founding_reservations drop constraint if exists founding_reservations_state_check;
alter table public.founding_reservations
 add constraint founding_reservations_state_check check (state in ('held','paid','released','refunded'));
alter table public.founding_reservations
 add column if not exists stripe_payment_intent_id text,
 add column if not exists stripe_refund_id text,
 add column if not exists refunded_at timestamptz,
 add column if not exists refund_reason text check (refund_reason in ('declined','withdrawn'));
create index if not exists founding_reservations_payment_intent_idx
 on public.founding_reservations(stripe_payment_intent_id);
-- Capacity already counts only held and paid reservations (see founding-capacity.sql),
-- so a refunded place is free again at once. Refunds are made from /admin/refunds.html
-- (api/admin-holding-payments.js) or in the Stripe dashboard; the webhook records both.
