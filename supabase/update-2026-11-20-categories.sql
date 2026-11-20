-- World Watch Calendar · update after the call with Marine (20 November 2026)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run twice.

-- 1. Categories: trade, public and collectors fairs become "Fairs and shows";
--    auctions are no longer listed, except the GPHG which becomes "Watch awards".
alter table public.events drop constraint if exists events_type_check;
delete from public.events where type = 'auction' and name !~* '(gphg|grand prix d.horlogerie)';
update public.events set type = 'award', type_label = 'Watch awards' where name ~* '(gphg|grand prix d.horlogerie)';
update public.events set type_label = 'Fair or show' where type = 'vintage';
update public.events set type = 'fairs' where type in ('trade', 'public', 'vintage');
alter table public.events add constraint events_type_check check (type in ('fairs', 'jewel', 'award'));

-- 2. Professional days (press_days) and public days
alter table public.events add column if not exists public_days text check (char_length(public_days) <= 80);
update public.events
   set press_days = '5 – 8 April 2027', public_days = '9 – 11 April 2027', exhibitors = '75 brands'
 where id = 'watches-and-wonders-geneva-2027-2027-04';

-- 3. Private contacts: a second address for exhibitors, and who submitted the listing
alter table public.submission_contacts add column if not exists exhibitor_email text
  check (exhibitor_email is null or (exhibitor_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(exhibitor_email) <= 200));
alter table public.submission_contacts add column if not exists role text
  check (role is null or role in ('Brand', 'Retailer', 'Journalist', 'Content creator', 'Organiser'));

-- 4. Chronopolis (independent watch fair, Les Halles de l'Île, Geneva)
insert into public.events (id, name, start_date, end_date, venue, city, country_code, country, type, type_label, exhibitors, dates_tbc, trade_only, free_entry, website, organiser, description, lat, lon, verified, source)
values
 ('chronopolis-2026-04', 'Chronopolis 2026', '2026-04-14', '2026-04-18', 'Les Halles de l''Île', 'Geneva', 'CH', 'Switzerland', 'fairs', 'Fair or show', '20 independent brands', false, false, true,
  'https://www.geneve.com/en/events/chronopolis', 'APRESDEMAIN Agency', 'A free watch fair open to all during Geneva watch week, bringing together twenty independent brands at Les Halles de l''Île, in the heart of Geneva.', 46.2047, 6.1418, false, 'team'),
 ('chronopolis-2027-04', 'Chronopolis 2027', '2027-04-06', '2027-04-10', 'Les Halles de l''Île', 'Geneva', 'CH', 'Switzerland', 'fairs', 'Fair or show', '≈ 20 independent brands', true, false, true,
  'https://www.geneve.com/en/events/chronopolis', 'APRESDEMAIN Agency', 'The independent watch fair of Geneva watch week returns to Les Halles de l''Île. Free and open to all. Dates for 2027 are still to be confirmed by the organiser.', 46.2047, 6.1418, false, 'team')
on conflict (id) do nothing;
