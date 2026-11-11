-- =====================================================================
-- Horology Calendar — database schema (Supabase / PostgreSQL)
-- Run this once in Supabase: SQL Editor → New query → paste → Run.
-- Then run seed.sql the same way to load the initial listings.
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table if not exists public.events (
  id            text primary key check (id ~ '^[a-z0-9-]{3,140}$'),
  name          text not null check (char_length(name) between 2 and 140),
  start_date    date not null,
  end_date      date not null,
  venue         text check (char_length(venue) <= 160),
  city          text not null check (char_length(city) between 1 and 80),
  city_label    text check (char_length(city_label) <= 80),
  country_code  text check (country_code ~ '^[A-Z]{2}$'),
  country       text not null check (char_length(country) between 2 and 80),
  type          text not null check (type in ('trade', 'public', 'jewel', 'vintage', 'auction')),
  type_label    text not null check (char_length(type_label) <= 40),
  exhibitors    text check (char_length(exhibitors) <= 40),
  dates_tbc     boolean not null default false,
  trade_only    boolean not null default false,
  free_entry    boolean not null default false,
  website       text check (website ~* '^https?://' and char_length(website) <= 300),
  organiser     text check (char_length(organiser) <= 140),
  description   text check (char_length(description) <= 600),
  press_days    text check (char_length(press_days) <= 80),
  image_url     text check (char_length(image_url) <= 400),
  image_credit  text check (char_length(image_credit) <= 120),
  image_alt     text check (char_length(image_alt) <= 200),
  gallery       jsonb not null default '[]'::jsonb,
  lat           double precision check (lat between -90 and 90),
  lon           double precision check (lon between -180 and 180),
  verified      boolean not null default false,   -- gold "Verified listing" badge
  hidden        boolean not null default false,   -- removed from the public site by the team
  reviewed      boolean not null default true,    -- false = new organiser listing waiting in "To review"
  source        text not null default 'team' check (source in ('team', 'organiser')),
  submitted_at  timestamptz,
  updated_on    date not null default current_date,
  created_at    timestamptz not null default now(),
  constraint dates_in_order check (end_date >= start_date),
  constraint dates_reasonable check (start_date >= date '2020-01-01' and end_date <= start_date + 62)
);

create index if not exists events_start_idx on public.events (start_date);

-- Private: organiser contact e-mails, never shown on the site.
create table if not exists public.submission_contacts (
  event_id   text primary key references public.events (id) on delete cascade,
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  created_at timestamptz not null default now()
);

-- Private: monthly newsletter sign-ups.
create table if not exists public.subscribers (
  email      text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  created_at timestamptz not null default now()
);

-- Team members allowed to use the admin desk (one row per Supabase user).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- Helper ----------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Guard rails for organiser submissions ---------------------
-- Whatever the browser sends, a listing created by a visitor is always
-- an unverified organiser listing waiting for review.

create or replace function public.events_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only requests coming from the website are restricted (not the SQL editor).
  if tg_op = 'INSERT' and coalesce(auth.role(), '') in ('anon', 'authenticated') and not public.is_admin() then
    new.verified     := false;
    new.hidden       := false;
    new.reviewed     := false;
    new.source       := 'organiser';
    new.submitted_at := now();
    new.updated_on   := current_date;
    new.gallery      := '[]'::jsonb;
    new.image_url    := null;
    new.image_credit := null;
    new.image_alt    := null;
    if new.start_date < current_date - 1 then
      raise exception 'Event dates must be in the future';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.updated_on := current_date;
  end if;
  return new;
end;
$$;

drop trigger if exists events_guard on public.events;
create trigger events_guard
  before insert or update on public.events
  for each row execute function public.events_guard();

-- ---------- Row-level security ----------------------------------------

alter table public.events              enable row level security;
alter table public.submission_contacts enable row level security;
alter table public.subscribers         enable row level security;
alter table public.admins              enable row level security;

-- Events: everyone reads visible listings; the team reads everything.
drop policy if exists "events read" on public.events;
create policy "events read" on public.events
  for select using (hidden = false or public.is_admin());

-- Events: anyone can publish a listing (it goes live at once, flagged for review).
drop policy if exists "events insert" on public.events;
create policy "events insert" on public.events
  for insert with check (true);

-- Events: only the team edits or deletes.
drop policy if exists "events update" on public.events;
create policy "events update" on public.events
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "events delete" on public.events;
create policy "events delete" on public.events
  for delete using (public.is_admin());

-- Organiser e-mails: anyone may add one with their listing; only the team reads.
drop policy if exists "contacts insert" on public.submission_contacts;
create policy "contacts insert" on public.submission_contacts
  for insert with check (
    exists (select 1 from public.events e
            where e.id = event_id and e.source = 'organiser'
              and e.submitted_at > now() - interval '10 minutes')
  );

drop policy if exists "contacts read" on public.submission_contacts;
create policy "contacts read" on public.submission_contacts
  for select using (public.is_admin());

-- Newsletter: anyone may subscribe; only the team reads the list.
drop policy if exists "subscribers insert" on public.subscribers;
create policy "subscribers insert" on public.subscribers
  for insert with check (true);

drop policy if exists "subscribers read" on public.subscribers;
create policy "subscribers read" on public.subscribers
  for select using (public.is_admin());

drop policy if exists "subscribers delete" on public.subscribers;
create policy "subscribers delete" on public.subscribers
  for delete using (public.is_admin());

-- Admins: a signed-in user can check whether they are on the list.
drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins
  for select using (user_id = auth.uid());

-- ---------- Table permissions for the public API ----------------------

grant select, insert on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant insert on public.submission_contacts to anon, authenticated;
grant select on public.submission_contacts to authenticated;
grant insert on public.subscribers to anon, authenticated;
grant select, delete on public.subscribers to authenticated;
grant select on public.admins to authenticated;
