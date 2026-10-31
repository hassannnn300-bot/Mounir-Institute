-- Run once in the Supabase SQL Editor (31 October 2026). 27 of the 30 Applied Maqamaat places are taken, so the
-- website must stop taking £25 holds after 3 more. The limit is a number in public.founding_settings, which the
-- owners can change in the Table Editor; hold_founding_place now reads it instead of the fixed 30 in
-- docs/founding-capacity.sql. Running this again keeps whatever limit is already set.
create table if not exists public.founding_settings (
 name text primary key,
 value integer not null,
 note text
);
alter table public.founding_settings enable row level security;
-- Holds already paid online stay counted, plus the 3 places still open.
insert into public.founding_settings(name, value, note)
select 'online_place_limit', count(*) + 3,
 'Most £25 holds (held or paid) the website allows in total. Set on 31 October 2026 to the holds paid by then plus the 3 places left.'
from public.founding_reservations where state = 'paid'
on conflict (name) do nothing;
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
 if (select count(*) from public.founding_reservations where state in ('held','paid'))
    >= coalesce((select value from public.founding_settings where name='online_place_limit'), 30) then
   return query select null::uuid,'full'::text; return;
 end if;
 insert into public.founding_reservations(application_id) values(p_application_id) returning id into v_id;
 return query select v_id,'held'::text;
end $$;
revoke all on function public.hold_founding_place(uuid) from public, anon, authenticated;
grant execute on function public.hold_founding_place(uuid) to service_role;
