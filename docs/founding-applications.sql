-- Run once in your private Supabase SQL editor. Never expose the service-role key in frontend code.
create table if not exists public.founding_applications (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 name text not null, email text not null unique, phone text not null,
 region text not null, age text not null, goal text not null,
 format text not null, start text not null,
 presale_interest boolean not null default false,
 status text not null default 'requested' check (status in ('requested','reviewing','offered','confirmed','declined','withdrawn'))
);
alter table public.founding_applications enable row level security;
-- No anonymous access: server-side service role only.
create index if not exists founding_applications_status_created_idx on public.founding_applications(status,created_at);
-- Capacity is a manual approval rule: confirm at most 30 applications; requests are NOT reservations.
