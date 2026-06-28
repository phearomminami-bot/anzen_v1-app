-- ============================================================================
-- Anzen — database schema for a fresh Supabase project
-- Run this ONCE in the new project:  Dashboard → SQL Editor → New query → paste → Run
--
-- NOTE ON SECURITY: RLS (Row Level Security) is left OFF here so the app works
-- exactly like before (it talks to the tables with the public/anon key). This is
-- PERMISSIVE — fine for setup/testing, but BEFORE giving 50 students real logins
-- we must add proper RLS policies. Ask Claude to do "RLS security" next.
-- ============================================================================

create table if not exists public.instructors (
  id            text primary key,
  name          text,
  en            text,
  phone         text,
  email         text,
  auth_user_id  uuid,
  extra         jsonb
);

create table if not exists public.vehicles (
  id      text primary key,
  plate   text,
  status  text,
  extra   jsonb
);

create table if not exists public.students (
  id            text primary key,
  name          text,
  en            text,
  status        text,
  inst_id       text,
  phone         text,
  email         text,
  auth_user_id  uuid,
  extra         jsonb
);

create table if not exists public.lessons (
  id          text primary key,
  date        text,
  h           numeric,
  len         numeric,
  student_id  text,
  inst_id     text,
  veh         text,
  status      text,
  extra       jsonb
);

create table if not exists public.invoices (
  id          text primary key,
  student_id  text,
  amount      numeric,
  status      text,
  date        text,
  due         text,
  extra       jsonb
);

create table if not exists public.staff (
  id     text primary key,
  name   text,
  en     text,
  extra  jsonb
);

create table if not exists public.lesson_content (
  code    text primary key,
  track   text,
  kind    text,
  km      text,
  en      text,
  mins    numeric,
  yt_id   text,
  sort    numeric,
  extra   jsonb
);

create table if not exists public.vehicle_inspections (
  vehicle_id      text,
  date            text,
  inspector       text,
  items           jsonb,
  fuel_level      text,
  custom_items    jsonb,
  renames         jsonb,
  notes           text,
  overall_status  text,
  extra           jsonb,
  primary key (vehicle_id, date)
);

create table if not exists public.attendance (
  date    text,
  emp_id  text,
  status  text,
  primary key (date, emp_id)
);

create table if not exists public.school_settings (
  id    int primary key,
  data  jsonb
);

-- Maps a logged-in auth user → their role + linked student/instructor id.
create table if not exists public.profiles (
  id            uuid primary key,
  role          text,
  linked_id     text,
  full_name     text,
  full_name_en  text
);

-- Let the app's public/anon key read & write these tables (RLS off = permissive).
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
