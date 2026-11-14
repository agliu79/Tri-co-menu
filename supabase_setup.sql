-- Tri-Co Eatmaxxing: run this once in Supabase (SQL Editor -> New query -> paste -> Run).

-- 1. Public content: one row per student holding their reviews, posts, likes, comments and reports
create table if not exists public.contrib (
  uid uuid primary key references auth.users(id) on delete cascade,
  doc jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Private data only the student can see: profile, favorites, calendar, reminders, Fuel log
create table if not exists public.private_docs (
  uid uuid not null references auth.users(id) on delete cascade,
  key text not null,
  doc jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (uid, key)
);

-- 3. Admins (can delete anyone's posts) and extra emails allowed to sign up (judges, demo accounts)
create table if not exists public.admins (uid uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.allowed_emails (email text primary key);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where uid = auth.uid()) $$;
grant execute on function public.is_admin() to authenticated;

-- 4. Row Level Security: who can read and write what
alter table public.contrib enable row level security;
alter table public.private_docs enable row level security;
alter table public.admins enable row level security;
alter table public.allowed_emails enable row level security;

drop policy if exists "signed-in students read all" on public.contrib;
create policy "signed-in students read all" on public.contrib for select to authenticated using (true);
drop policy if exists "students create their own row" on public.contrib;
create policy "students create their own row" on public.contrib for insert to authenticated with check (auth.uid() = uid);
drop policy if exists "students edit their own row, admins edit any" on public.contrib;
create policy "students edit their own row, admins edit any" on public.contrib for update to authenticated
  using (auth.uid() = uid or public.is_admin()) with check (auth.uid() = uid or public.is_admin());

drop policy if exists "own private data only" on public.private_docs;
create policy "own private data only" on public.private_docs for all to authenticated
  using (auth.uid() = uid) with check (auth.uid() = uid);
-- admins and allowed_emails have no policies, so the website can't read or change them (only you, in the dashboard)

-- 5. Only Tri-Co emails (plus anything in allowed_emails) can create an account. Enforced by the server.
create or replace function public.enforce_tri_co_email() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if lower(split_part(new.email, '@', 2)) not in ('brynmawr.edu', 'haverford.edu', 'swarthmore.edu')
     and not exists (select 1 from public.allowed_emails where email = lower(new.email)) then
    raise exception 'Only Bryn Mawr, Haverford and Swarthmore emails can sign up';
  end if;
  return new;
end $$;
drop trigger if exists enforce_tri_co_email on auth.users;
create trigger enforce_tri_co_email before insert on auth.users
  for each row execute function public.enforce_tri_co_email();

-- 6. Live updates: new posts, likes and comments appear without refreshing
do $$ begin
  alter publication supabase_realtime add table public.contrib;
exception when duplicate_object then null; end $$;

-- 7. Photo storage: anyone can view, students upload into their own folder, delete their own (admins any)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "students upload to own folder" on storage.objects;
create policy "students upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "students delete own photos, admins any" on storage.objects;
create policy "students delete own photos, admins any" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- After you sign up on the site yourself, make yourself an admin:
--   insert into public.admins (uid) select id from auth.users where email = 'you@haverford.edu';
-- To let a judge sign up with a non-college email:
--   insert into public.allowed_emails (email) values ('judge@example.com');
