-- World Watch Calendar · member accounts (production version of the prototype)
-- Run once in Supabase → SQL Editor when the accounts go live.
-- Sign-in itself is handled by Supabase Auth (email magic link, optional Google).

-- 1. One profile per member
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null check (char_length(first_name) between 1 and 80),
  role        text check (role in ('lover','collector','journalist','brand','organiser','other')),
  country     text check (char_length(country) <= 8),
  interests   text[] not null default '{}',
  newsletter  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Events a member saves to "My agenda"
create table if not exists public.saved_events (
  user_id    uuid not null references auth.users (id) on delete cascade,
  event_id   text not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.profiles     enable row level security;
alter table public.saved_events enable row level security;

-- A member sees and edits only their own data
create policy "own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile: insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own profile: delete" on public.profiles for delete using (auth.uid() = id);

create policy "own saves: read"   on public.saved_events for select using (auth.uid() = user_id);
create policy "own saves: insert" on public.saved_events for insert with check (auth.uid() = user_id);
create policy "own saves: delete" on public.saved_events for delete using (auth.uid() = user_id);

-- Admins (289 Consulting) can read everything, for the audience insights
create policy "admins: read profiles" on public.profiles     for select using (public.is_admin());
create policy "admins: read saves"    on public.saved_events for select using (public.is_admin());

-- 3. Audience insights for the admin page (aggregates only, no personal data)
create or replace view public.insights_roles     with (security_invoker = true) as
  select coalesce(role, 'unknown') as role, count(*) as members from public.profiles group by 1;
create or replace view public.insights_countries with (security_invoker = true) as
  select coalesce(country, 'unknown') as country, count(*) as members from public.profiles group by 1;
create or replace view public.insights_top_saved with (security_invoker = true) as
  select event_id, count(*) as saves from public.saved_events group by 1 order by 2 desc;
