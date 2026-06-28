-- ============================================================================
-- Anzen — real-login (Supabase Auth) setup for the NEW project
-- Run AFTER supabase_schema.sql, in: Dashboard → SQL Editor → New query → Run
--
-- IMPORTANT: replace  your-email@example.com  on the LAST line with the email
-- you used when creating your admin user in Authentication → Add user.
-- ============================================================================

-- 1) When any auth user is created, auto-create their profile row from the
--    metadata the app sends (role / full_name / linked_id). This is what lets
--    admin-created staff & student accounts get the correct role automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, linked_id, full_name, full_name_en)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'linked_id',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'full_name_en'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Make YOUR account an admin (run after you've created the user in the
--    dashboard). Change the email below to your admin email.
insert into public.profiles (id, role, full_name)
select id, 'admin', 'Admin'
from auth.users
where lower(email) = lower('your-email@example.com')
on conflict (id) do update set role = 'admin';
