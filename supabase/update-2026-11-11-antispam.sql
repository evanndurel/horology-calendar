-- Anti-spam update. Run once in Supabase: SQL Editor → New query → paste → Run.

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
    -- Anti-spam: limit how many listings can be published by visitors.
    if (select count(*) from public.events where source = 'organiser' and submitted_at > now() - interval '1 hour') >= 20 then
      raise exception 'Too many new listings right now, please try again in an hour';
    end if;
    if (select count(*) from public.events where source = 'organiser' and website = new.website and submitted_at > now() - interval '1 day') >= 5 then
      raise exception 'This website already has several new listings today';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.updated_on := current_date;
  end if;
  return new;
end;
$$;
