-- ============================================================================
-- Anzen — helper functions + auth trigger (02_helpers.sql)
-- Run this SECOND (after 01_schema.sql, before 03_rls.sql).
-- ============================================================================

-- current_app_role(): the role of the logged-in user.
-- SECURITY DEFINER + fixed search_path so it can read `profiles` without being
-- blocked by (or recursing into) RLS.
create or replace function current_app_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

create or replace function is_instructor()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'instructor' from profiles where id = auth.uid()), false)
$$;

-- my_linked_id(): the domain id (e.g. 'S-1' or 'I-01') the current user maps to.
create or replace function my_linked_id()
returns text
language sql stable security definer set search_path = public as $$
  select linked_id from profiles where id = auth.uid()
$$;

-- ── Auto-create a profile when a new auth user signs up ─────────────────────
-- Reads optional sign-up metadata: { role, full_name, full_name_en, linked_id }
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name, full_name_en, linked_id)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'full_name_en',
    new.raw_user_meta_data->>'linked_id'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
