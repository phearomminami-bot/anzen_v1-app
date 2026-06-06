-- ============================================================================
-- Anzen Driving School — Supabase schema (01_schema.sql)
-- Run this FIRST in the Supabase SQL editor.
--
-- Design notes:
--  • Domain tables keep the app's existing text IDs as primary keys
--    (S-1, I-01, VH-001, INV-2026-0425 …) so your exported backup JSON maps
--    over directly. Auth users (login accounts) use Supabase's UUIDs and are
--    linked to a student/instructor record via `auth_user_id`.
--  • Every table has `extra jsonb` to absorb any field not modeled as a column
--    (forward-compatible — no migration needed when the app adds a field).
--  • Status columns are plain text (the app uses mixed-case values like
--    'Pending' / 'overdue'); CHECK constraints are intentionally loose.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ── Roles ───────────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('admin', 'instructor', 'student');
exception when duplicate_object then null; end $$;

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================================
-- profiles — bridge between auth.users (login) and the app's roles
-- One row per login account. Created automatically on signup (see 03_helpers).
-- ============================================================================
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'student',
  full_name    text,
  full_name_en text,
  phone        text,
  -- the domain record this account maps to, e.g. 'S-1' or 'I-01'
  linked_id    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- instructors
-- ============================================================================
create table if not exists instructors (
  id            text primary key,                 -- 'I-01'
  auth_user_id  uuid references auth.users(id) on delete set null,
  name          text not null,                    -- Khmer name
  en            text,
  role          text,                             -- 'គ្រូបង្រៀន · Instructor'
  role_en       text,
  cls           text[] default '{B}',             -- license classes taught
  nationality   text,
  rating        numeric default 0,
  rating_count  int default 0,
  students      int default 0,
  since         text,
  lang          text,                             -- spoken languages
  photo         text,
  salary        numeric default 0,
  hours         int default 40,
  phone         text,
  email         text,
  extra         jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_instructors_updated before update on instructors
  for each row execute function set_updated_at();

-- ============================================================================
-- students
-- ============================================================================
create table if not exists students (
  id              text primary key,               -- 'S-1'
  auth_user_id    uuid references auth.users(id) on delete set null,
  name            text not null,
  en              text,
  cls             text,                           -- 'ខ (ឡានបួនកង់)'
  inst_id         text references instructors(id) on delete set null,
  inst            text,
  hours           numeric default 0,
  target          numeric default 30,
  status          text default 'New',             -- New / Active / Road exam soon / Cleared …
  next            text,
  phone           text,
  email           text,
  gender          text,                           -- 'M' | 'F'
  age             int,
  dob             date,
  nat_id          text,
  eye_left        text,
  eye_right       text,
  eye_both        text,
  paid            numeric default 0,
  fee             numeric default 0,
  photo           text,
  veh_type        text,
  trans           text,                           -- 'AT' | 'MT'
  shift           text,
  days            text,
  reg_date        text,
  student_type    text,
  telegram        text,                           -- chat id / phone for reminders
  -- address
  addr_province   text, addr_district text, addr_commune text, addr_village text,
  addr_house      text, addr_street   text, address      text,
  -- per-lesson checklist {content_code: {done, done_at, comment}}  (also see lesson_progress)
  extra           jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_students_inst on students(inst_id);
create index if not exists idx_students_status on students(status);
create trigger trg_students_updated before update on students
  for each row execute function set_updated_at();

-- ============================================================================
-- vehicles
-- ============================================================================
create table if not exists vehicles (
  id          text primary key,                   -- 'VH-001'
  plate       text,
  make        text,
  model       text,
  year        text,
  cls         text,
  color       text,
  trans       text,
  seats       text,
  fuel        text,
  status      text default 'Active',              -- Active / Idle / Service due / Workshop
  service     text,
  photo       text,
  extra       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_vehicles_updated before update on vehicles
  for each row execute function set_updated_at();

-- ============================================================================
-- lessons  (the schedule)
-- ============================================================================
create table if not exists lessons (
  id          text primary key,                   -- 'L-…'
  date        date not null,
  h           int not null,                       -- start hour (24h)
  len         numeric not null default 1,         -- hours
  student_id  text references students(id) on delete set null,
  inst_id     text references instructors(id) on delete set null,
  veh         text references vehicles(id) on delete set null,
  type        text,                               -- full label
  color       text,                               -- a|b|c|d|e (theory/practical hue)
  lesson_ids  text[] default '{}',                -- curriculum content codes covered
  lesson_no   text,                               -- short code e.g. '技能1'
  status      text default 'scheduled',           -- scheduled / done / cancelled
  pickup      text,
  location    text,
  note        text,
  guests      jsonb default '[]',
  extra       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_lessons_date    on lessons(date);
create index if not exists idx_lessons_student on lessons(student_id);
create index if not exists idx_lessons_inst    on lessons(inst_id);
create trigger trg_lessons_updated before update on lessons
  for each row execute function set_updated_at();

-- ============================================================================
-- invoices
-- ============================================================================
create table if not exists invoices (
  id          text primary key,                   -- 'INV-2026-0425'
  student_id  text references students(id) on delete set null,
  name        text,
  en          text,
  amount      numeric not null default 0,
  descr       text,
  date        date,
  due         date,
  method      text,
  status      text default 'Pending',             -- Pending / Paid / overdue
  extra       jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_invoices_student on invoices(student_id);
create index if not exists idx_invoices_status  on invoices(status);
create trigger trg_invoices_updated before update on invoices
  for each row execute function set_updated_at();

-- ============================================================================
-- staff  (HR — includes instructors mirrored as SF-… plus non-teaching staff)
-- ============================================================================
create table if not exists staff (
  id           text primary key,                  -- 'SF-…'
  inst_id      text references instructors(id) on delete set null,
  name         text,
  en           text,
  role         text, role_km text,
  dept         text, dept_km text,
  phone        text,
  email        text,
  since        text,
  salary_type  text,
  salary       numeric default 0,
  leave        int default 18,
  status       text default 'At desk',
  photo        text,
  docs         jsonb default '{}',
  schedule     jsonb default '[]',
  extra        jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_staff_updated before update on staff
  for each row execute function set_updated_at();

-- ============================================================================
-- lesson_progress  (per-student curriculum checklist + instructor comment)
-- ============================================================================
create table if not exists lesson_progress (
  student_id    text not null references students(id) on delete cascade,
  content_code  text not null,                    -- 'pt-01', 'tt-03' …
  done          boolean not null default false,
  done_at       timestamptz,
  comment       text,
  updated_at    timestamptz not null default now(),
  primary key (student_id, content_code)
);
create trigger trg_lesson_progress_updated before update on lesson_progress
  for each row execute function set_updated_at();

-- ============================================================================
-- vehicle_inspections  (daily 日常点検)
-- ============================================================================
create table if not exists vehicle_inspections (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      text references vehicles(id) on delete cascade,
  date            date not null,
  inspector       text,
  items           jsonb default '{}',             -- {itemId: 'ok'|'warn'|'fail'}
  fuel_level      int,                            -- 0|25|50|75|100
  custom_items    jsonb default '{}',
  renames         jsonb default '{}',
  notes           text,
  overall_status  text,                           -- ok|warn|fail
  saved_at        timestamptz default now(),
  extra           jsonb not null default '{}',
  unique (vehicle_id, date)
);
create index if not exists idx_inspections_vehicle on vehicle_inspections(vehicle_id);
create index if not exists idx_inspections_date    on vehicle_inspections(date);

-- ============================================================================
-- lesson_content  (the curriculum library — Tab "មេរៀន")
-- ============================================================================
create table if not exists lesson_content (
  code        text primary key,                   -- 'tt-01','pt-01','te-01', or video id
  track       text not null,                      -- 'theory' | 'practical'
  kind        text not null,                      -- 'text' | 'video' | 'exercise'
  km          text,
  en          text,
  mins        int,
  duration    int,                                -- video seconds
  yt_id       text,
  body_km     text,
  body_en     text,
  questions   jsonb default '[]',                 -- quiz questions
  sort        int default 0,
  extra       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
create index if not exists idx_lesson_content_track on lesson_content(track, kind);
create trigger trg_lesson_content_updated before update on lesson_content
  for each row execute function set_updated_at();

-- ============================================================================
-- attendance  (staff daily attendance)
-- ============================================================================
create table if not exists attendance (
  date     date not null,
  emp_id   text not null,                          -- staff/instructor id
  status   text not null,                          -- 'P'|'A'|'L'|'H'
  primary key (date, emp_id)
);

-- ============================================================================
-- announcements  (Tab "ការជូនដំណឹង" — broadcast log)
-- ============================================================================
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  body        text,
  channel     text,                                -- 'telegram'|'whatsapp'|'app'
  recipients  jsonb default '[]',                  -- student ids reached
  sent_by     uuid references auth.users(id) on delete set null,
  sent_at     timestamptz default now(),
  extra       jsonb not null default '{}'
);
create index if not exists idx_announcements_sent on announcements(sent_at desc);

-- ============================================================================
-- notifications  (per-user in-app notifications)
-- ============================================================================
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  title       text,
  body        text,
  kind        text,                                -- lesson24|payment|exam …
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, read);

-- ============================================================================
-- school_settings  (single-row config blob — name, logo, pricing, payments…)
-- ============================================================================
create table if not exists school_settings (
  id          int primary key default 1,
  data        jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into school_settings (id, data) values (1, '{}')
  on conflict (id) do nothing;
create trigger trg_school_settings_updated before update on school_settings
  for each row execute function set_updated_at();
