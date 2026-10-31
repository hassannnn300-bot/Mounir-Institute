-- Run once in the Supabase SQL Editor. Powers the "people viewing now" line on each homepage plan.
-- While a plan card is on someone's screen, their page sends a random id and the plans in view every
-- 20 seconds through /api/live-viewers. The id is made fresh on each page load and never stored on
-- their device; nothing else about the visitor is kept, and rows are deleted after 5 minutes.
create table if not exists public.live_viewers (
 viewer_id uuid primary key,
 plans text[] not null default '{}',
 last_seen timestamptz not null default now()
);
alter table public.live_viewers enable row level security;
-- Records which plans this viewer has on screen (none means they left) and returns how many people
-- are viewing each plan and the plans overall, for example {"intensive": 3, "mastery": 1, "total": 3}.
create or replace function public.ping_live_viewer(p_viewer_id uuid, p_plans text[])
returns jsonb language plpgsql security definer set search_path=public as $$
begin
 delete from public.live_viewers where last_seen < now() - interval '5 minutes';
 if coalesce(cardinality(p_plans), 0) = 0 then
   delete from public.live_viewers where viewer_id = p_viewer_id;
 else
   insert into public.live_viewers(viewer_id, plans, last_seen) values (p_viewer_id, p_plans, now())
   on conflict (viewer_id) do update set plans = excluded.plans, last_seen = excluded.last_seen;
 end if;
 -- A viewer counts while their last ping is under 45 seconds old (pings come every 20 seconds).
 return (select coalesce(jsonb_object_agg(plan, viewers), '{}'::jsonb) from (
   select plan, count(*) as viewers from public.live_viewers, unnest(plans) as plan
   where last_seen > now() - interval '45 seconds' group by plan) counts)
   || jsonb_build_object('total', (select count(*) from public.live_viewers where last_seen > now() - interval '45 seconds'));
end $$;
revoke all on function public.ping_live_viewer(uuid, text[]) from public, anon, authenticated;
grant execute on function public.ping_live_viewer(uuid, text[]) to service_role;
