
create type public.app_role as enum ('caretaker', 'elder');
create type public.dose_status as enum ('upcoming', 'taken', 'missed');

-- FAMILIES
create table public.families (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^CC[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 80),
  timezone text not null default 'Asia/Kolkata',
  pre_reminder_minutes int not null default 15 check (pre_reminder_minutes between 5 and 120),
  second_reminder_minutes int not null default 7 check (second_reminder_minutes between 1 and 14),
  missed_after_minutes int not null default 15 check (missed_after_minutes between 10 and 60),
  email_enabled boolean not null default true,
  email_dry_run boolean not null default true,
  is_sample boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  full_name text not null default '' check (char_length(full_name) <= 80),
  email text check (email is null or char_length(email) <= 254),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  created_at timestamptz not null default now()
);
create index profiles_family_idx on public.profiles(family_id);

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- HELPER FUNCTIONS (security definer to avoid RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.current_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_family_member(_family uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _family is not null and exists (select 1 from public.profiles where id = auth.uid() and family_id = _family)
$$;

create or replace function public.is_caretaker_of(_family uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _family is not null and exists (
    select 1 from public.profiles p join public.user_roles r on r.user_id = p.id
    where p.id = auth.uid() and p.family_id = _family and r.role = 'caretaker'
  )
$$;

create or replace function public.is_caretaker_of_folder(_folder text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if _folder is null or _folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_caretaker_of(_folder::uuid);
end $$;

-- Role limit enforcement
create or replace function public.enforce_role_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare fam uuid; cnt int;
begin
  select family_id into fam from public.profiles where id = new.user_id;
  if fam is null then
    raise exception 'A family must be set before a role is assigned';
  end if;
  perform 1 from public.families where id = fam for update;
  if exists (select 1 from public.user_roles where user_id = new.user_id) then
    raise exception 'This account already has a role';
  end if;
  select count(*) into cnt from public.user_roles r join public.profiles p on p.id = r.user_id
    where p.family_id = fam and r.role = new.role;
  if new.role = 'caretaker' and cnt >= 3 then
    raise exception 'A family can have at most 3 caretakers';
  end if;
  if new.role = 'elder' and cnt >= 2 then
    raise exception 'A family can have at most 2 elders';
  end if;
  return new;
end $$;
create trigger user_roles_limits before insert on public.user_roles
for each row execute function public.enforce_role_limits();

create or replace function public.protect_profile_family()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.family_id is not null and new.family_id is distinct from old.family_id
     and exists (select 1 from public.user_roles where user_id = new.id) then
    raise exception 'Members cannot move between families';
  end if;
  return new;
end $$;
create trigger profiles_protect_family before update on public.profiles
for each row execute function public.protect_profile_family();

-- New auth user -> profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80),
    case when new.raw_user_meta_data->>'kind' = 'elder'
      then nullif(new.raw_user_meta_data->>'contact_email', '')
      else new.email end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- MEDICINES
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  dose text not null check (char_length(dose) between 1 and 60),
  times text[] not null check (cardinality(times) between 1 and 8),
  days smallint[] not null default '{0,1,2,3,4,5,6}' check (cardinality(days) between 1 and 7),
  start_date date not null default current_date,
  end_date date,
  notes text check (notes is null or char_length(notes) <= 500),
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medicines_family_idx on public.medicines(family_id);

create or replace function public.validate_medicine()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from unnest(new.times) t where t !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') then
    raise exception 'Times must be HH:MM';
  end if;
  if exists (select 1 from unnest(new.days) d where d < 0 or d > 6) then
    raise exception 'Days must be between 0 and 6';
  end if;
  if new.end_date is not null and new.end_date < new.start_date then
    raise exception 'End date must be after start date';
  end if;
  if not exists (
    select 1 from public.profiles p join public.user_roles r on r.user_id = p.id
    where p.id = new.elder_id and p.family_id = new.family_id and r.role = 'elder'
  ) then
    raise exception 'Medicine must belong to an elder of this family';
  end if;
  new.times := (select array_agg(distinct t order by t) from unnest(new.times) t);
  new.updated_at := now();
  return new;
end $$;
create trigger medicines_validate before insert or update on public.medicines
for each row execute function public.validate_medicine();

-- DOSES
create table public.doses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  elder_id uuid not null references public.profiles(id) on delete cascade,
  medicine_name text not null,
  dose text not null,
  scheduled_at timestamptz not null,
  status public.dose_status not null default 'upcoming',
  taken_at timestamptz,
  pre_reminder_sent_at timestamptz,
  due_reminder_sent_at timestamptz,
  second_reminder_sent_at timestamptz,
  missed_alert_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (medicine_id, scheduled_at)
);
create index doses_family_time_idx on public.doses(family_id, scheduled_at);
create index doses_status_time_idx on public.doses(status, scheduled_at);
create index doses_elder_time_idx on public.doses(elder_id, scheduled_at);

-- Generate today's and tomorrow's doses (family time zone) for one medicine
create or replace function public.generate_doses_for_medicine(_med uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m record; d date; t text; ts timestamptz; today date;
begin
  select med.*, f.timezone as tz into m
  from public.medicines med join public.families f on f.id = med.family_id
  where med.id = _med;
  if not found or not m.active then return; end if;
  today := (now() at time zone m.tz)::date;
  for d in select g::date from generate_series(today, today + 1, interval '1 day') g loop
    continue when d < m.start_date or (m.end_date is not null and d > m.end_date);
    continue when not (extract(dow from d)::smallint = any (m.days));
    foreach t in array m.times loop
      ts := (d + t::time) at time zone m.tz;
      if ts > now() then
        insert into public.doses (family_id, medicine_id, elder_id, medicine_name, dose, scheduled_at)
        values (m.family_id, m.id, m.elder_id, m.name, m.dose, ts)
        on conflict (medicine_id, scheduled_at) do nothing;
      end if;
    end loop;
  end loop;
end $$;

create or replace function public.generate_all_doses()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select id from public.medicines where active loop
    perform public.generate_doses_for_medicine(r.id);
  end loop;
end $$;

create or replace function public.medicines_after_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    delete from public.doses
    where medicine_id = new.id and status = 'upcoming' and scheduled_at > now()
      and pre_reminder_sent_at is null and due_reminder_sent_at is null;
    update public.doses set medicine_name = new.name, dose = new.dose
    where medicine_id = new.id and status = 'upcoming';
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.generate_doses_for_medicine(new.id);
  end if;
  insert into public.audit_log (family_id, actor_id, action, details)
  values (
    coalesce(new.family_id, old.family_id), auth.uid(),
    'medicine.' || lower(tg_op),
    jsonb_build_object('medicine', coalesce(new.name, old.name), 'dose', coalesce(new.dose, old.dose))
  );
  return null;
end $$;

-- ALERTS
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.profiles(id) on delete cascade,
  dose_id uuid references public.doses(id) on delete cascade,
  kind text not null default 'missed_dose',
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index alerts_family_idx on public.alerts(family_id, created_at desc);

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.profiles(id) on delete set null,
  file_path text not null,
  file_name text not null check (char_length(file_name) <= 200),
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 10485760),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  summary text,
  flags jsonb not null default '[]'::jsonb,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  summarized_at timestamptz
);
create index reports_family_idx on public.reports(family_id, created_at desc);

-- ELDER QUESTIONS
create table public.assistant_questions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 1000),
  answer text,
  created_at timestamptz not null default now()
);
create index assistant_questions_family_idx on public.assistant_questions(family_id, created_at desc);

-- APPOINTMENTS
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  location text check (location is null or char_length(location) <= 200),
  scheduled_at timestamptz not null,
  notes text check (notes is null or char_length(notes) <= 500),
  day_before_sent_at timestamptz,
  hours_before_sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index appointments_family_idx on public.appointments(family_id, scheduled_at);

-- NOTIFICATION LOG
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  recipient text not null,
  kind text not null,
  subject text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dry_run', 'failed', 'skipped')),
  error text,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);
create index notification_log_family_idx on public.notification_log(family_id, created_at desc);

-- AUDIT LOG
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  actor_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_family_idx on public.audit_log(family_id, created_at desc);

create trigger medicines_after_change after insert or update or delete on public.medicines
for each row execute function public.medicines_after_change();

-- RATE LIMITS (server only)
create table public.rate_limits (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now(),
  locked_until timestamptz
);

create or replace function public.rate_limit_is_locked(_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select locked_until > now() from public.rate_limits where key = _key), false)
$$;

create or replace function public.rate_limit_hit(_key text, _max int, _window_seconds int, _lock_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.rate_limits;
begin
  insert into public.rate_limits as rl (key, count, window_start)
  values (_key, 1, now())
  on conflict (key) do update set
    count = case when rl.window_start < now() - make_interval(secs => _window_seconds) then 1 else rl.count + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => _window_seconds) then now() else rl.window_start end
  returning * into r;
  if r.locked_until is not null and r.locked_until > now() then
    return false;
  end if;
  if r.count > _max then
    update public.rate_limits set locked_until = now() + make_interval(secs => _lock_seconds) where key = _key;
    return false;
  end if;
  return true;
end $$;

create or replace function public.rate_limit_clear(_key text)
returns void language sql security definer set search_path = public as $$
  delete from public.rate_limits where key = _key
$$;

-- Elder marks own dose taken
create or replace function public.mark_dose_taken(_dose uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare d public.doses;
begin
  update public.doses set status = 'taken', taken_at = now()
  where id = _dose and elder_id = auth.uid() and status = 'upcoming'
    and scheduled_at <= now() + interval '30 minutes'
  returning * into d;
  if not found then
    raise exception 'This tablet cannot be marked right now';
  end if;
  update public.alerts set resolved_at = now(), resolved_by = auth.uid() where dose_id = d.id and resolved_at is null;
  insert into public.audit_log (family_id, actor_id, action, details)
  values (d.family_id, auth.uid(), 'dose.taken', jsonb_build_object('medicine', d.medicine_name, 'dose', d.dose, 'scheduled_at', d.scheduled_at));
  return d.taken_at;
end $$;

-- GRANTS
grant select, insert, update, delete on public.families, public.profiles, public.user_roles, public.medicines,
  public.doses, public.alerts, public.reports, public.assistant_questions, public.appointments,
  public.notification_log, public.audit_log to authenticated;
grant all on public.families, public.profiles, public.user_roles, public.medicines, public.doses, public.alerts,
  public.reports, public.assistant_questions, public.appointments, public.notification_log, public.audit_log,
  public.rate_limits to service_role;

revoke execute on function public.rate_limit_is_locked(text), public.rate_limit_hit(text, int, int, int),
  public.rate_limit_clear(text), public.generate_all_doses(), public.generate_doses_for_medicine(uuid)
  from public, anon, authenticated;
grant execute on function public.rate_limit_is_locked(text), public.rate_limit_hit(text, int, int, int),
  public.rate_limit_clear(text), public.generate_all_doses(), public.generate_doses_for_medicine(uuid) to service_role;
revoke execute on function public.mark_dose_taken(uuid) from public, anon;
grant execute on function public.mark_dose_taken(uuid) to authenticated;

-- RLS
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.medicines enable row level security;
alter table public.doses enable row level security;
alter table public.alerts enable row level security;
alter table public.reports enable row level security;
alter table public.assistant_questions enable row level security;
alter table public.appointments enable row level security;
alter table public.notification_log enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limits enable row level security;

create policy "Members view their family" on public.families for select to authenticated
  using (public.is_family_member(id));
create policy "Caretakers update their family" on public.families for update to authenticated
  using (public.is_caretaker_of(id)) with check (public.is_caretaker_of(id));

create policy "View own profile and family members" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_family_member(family_id));

create policy "View own role and family roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.profiles p where p.id = user_roles.user_id and public.is_family_member(p.family_id)));

create policy "Caretakers view family medicines; elders view own" on public.medicines for select to authenticated
  using (public.is_caretaker_of(family_id) or (elder_id = auth.uid()));
create policy "Caretakers add medicines" on public.medicines for insert to authenticated
  with check (public.is_caretaker_of(family_id));
create policy "Caretakers edit medicines" on public.medicines for update to authenticated
  using (public.is_caretaker_of(family_id)) with check (public.is_caretaker_of(family_id));
create policy "Caretakers delete medicines" on public.medicines for delete to authenticated
  using (public.is_caretaker_of(family_id));

create policy "Caretakers view family doses; elders view own" on public.doses for select to authenticated
  using (public.is_caretaker_of(family_id) or elder_id = auth.uid());

create policy "Caretakers view alerts" on public.alerts for select to authenticated
  using (public.is_caretaker_of(family_id));
create policy "Caretakers resolve alerts" on public.alerts for update to authenticated
  using (public.is_caretaker_of(family_id)) with check (public.is_caretaker_of(family_id));

create policy "Caretakers view reports" on public.reports for select to authenticated
  using (public.is_caretaker_of(family_id));
create policy "Caretakers add reports" on public.reports for insert to authenticated
  with check (public.is_caretaker_of(family_id) and uploaded_by = auth.uid());
create policy "Caretakers update reports" on public.reports for update to authenticated
  using (public.is_caretaker_of(family_id)) with check (public.is_caretaker_of(family_id));
create policy "Caretakers delete reports" on public.reports for delete to authenticated
  using (public.is_caretaker_of(family_id));

create policy "Caretakers view family questions; elders view own" on public.assistant_questions for select to authenticated
  using (public.is_caretaker_of(family_id) or elder_id = auth.uid());
create policy "Elders save own questions" on public.assistant_questions for insert to authenticated
  with check (elder_id = auth.uid() and family_id = public.current_family_id() and public.has_role(auth.uid(), 'elder'));

create policy "Caretakers view appointments" on public.appointments for select to authenticated
  using (public.is_caretaker_of(family_id));
create policy "Caretakers add appointments" on public.appointments for insert to authenticated
  with check (public.is_caretaker_of(family_id));
create policy "Caretakers edit appointments" on public.appointments for update to authenticated
  using (public.is_caretaker_of(family_id)) with check (public.is_caretaker_of(family_id));
create policy "Caretakers delete appointments" on public.appointments for delete to authenticated
  using (public.is_caretaker_of(family_id));

create policy "Caretakers view notification log" on public.notification_log for select to authenticated
  using (public.is_caretaker_of(family_id));
create policy "Caretakers view audit log" on public.audit_log for select to authenticated
  using (public.is_caretaker_of(family_id));

-- STORAGE POLICIES (bucket family-files, first folder = family id)
create policy "Caretakers read family files" on storage.objects for select to authenticated
  using (bucket_id = 'family-files' and public.is_caretaker_of_folder((storage.foldername(name))[1]));
create policy "Caretakers upload family files" on storage.objects for insert to authenticated
  with check (bucket_id = 'family-files' and public.is_caretaker_of_folder((storage.foldername(name))[1])
    and lower(storage.extension(name)) in ('pdf', 'jpg', 'jpeg', 'png'));
create policy "Caretakers delete family files" on storage.objects for delete to authenticated
  using (bucket_id = 'family-files' and public.is_caretaker_of_folder((storage.foldername(name))[1]));
