-- Run in Supabase SQL Editor before enabling Founding Class checkout.
-- Atomic capacity allocation: 30 paid/active checkout reservations maximum.
create table if not exists public.founding_reservations (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.founding_applications(id),
 stripe_session_id text unique,
 state text not null default 'held' check (state in ('held','paid','released')),
 expires_at timestamptz not null default (now() + interval '2 hours'),
 created_at timestamptz not null default now(),
 paid_at timestamptz
);
create unique index if not exists founding_one_active_per_application
 on public.founding_reservations(application_id) where state in ('held','paid');
alter table public.founding_reservations enable row level security;
create or replace function public.hold_founding_place(p_application_id uuid)
returns table(reservation_id uuid, result text) language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
 perform pg_advisory_xact_lock(30050);
 update public.founding_reservations set state='released'
 where state='held' and expires_at < now();
 if not exists(select 1 from public.founding_applications where id=p_application_id and status not in ('declined','withdrawn')) then
   return query select null::uuid,'ineligible'::text; return;
 end if;
 select id into v_id from public.founding_reservations where application_id=p_application_id and state in ('held','paid') limit 1;
 if v_id is not null then return query select v_id,'existing'::text; return; end if;
 if (select count(*) from public.founding_reservations where state in ('held','paid')) >= 30 then
   return query select null::uuid,'full'::text; return;
 end if;
 insert into public.founding_reservations(application_id) values(p_application_id) returning id into v_id;
 return query select v_id,'held'::text;
end $$;
revoke all on function public.hold_founding_place(uuid) from public, anon, authenticated;
grant execute on function public.hold_founding_place(uuid) to service_role;
-- Stripe webhook marks paid; refund requests must be processed by staff in Stripe,
-- then release the place in Supabase when appropriate.
