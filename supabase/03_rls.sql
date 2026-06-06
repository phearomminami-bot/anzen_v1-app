-- ============================================================================
-- Anzen — Row Level Security (03_rls.sql)
-- Run this THIRD. Defines who can read/write what.
--
-- Roles:
--   admin       → full access to everything
--   instructor  → reads operational data; manages their own lessons,
--                 inspections, and their students' progress
--   student     → reads only their own record, lessons, invoices, progress;
--                 reads the curriculum, announcements, settings
-- Policies are PERMISSIVE (OR'd), so the admin policy is added everywhere
-- alongside the narrower role policies.
-- ============================================================================

-- Enable RLS on all tables
alter table profiles            enable row level security;
alter table instructors         enable row level security;
alter table students            enable row level security;
alter table vehicles            enable row level security;
alter table lessons             enable row level security;
alter table invoices            enable row level security;
alter table staff               enable row level security;
alter table lesson_progress     enable row level security;
alter table vehicle_inspections enable row level security;
alter table lesson_content      enable row level security;
alter table attendance          enable row level security;
alter table announcements       enable row level security;
alter table notifications       enable row level security;
alter table school_settings     enable row level security;

-- ── profiles ────────────────────────────────────────────────────────────────
create policy profiles_self_read   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all   on profiles for all using (is_admin()) with check (is_admin());

-- ── instructors ─────────────────────────────────────────────────────────────
create policy instructors_read       on instructors for select using (auth.uid() is not null);
create policy instructors_self_update on instructors for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy instructors_admin_all  on instructors for all using (is_admin()) with check (is_admin());

-- ── students ────────────────────────────────────────────────────────────────
-- admin: all · instructor: their students · student: own row
create policy students_admin_all on students for all using (is_admin()) with check (is_admin());
create policy students_instructor_read on students for select
  using (is_instructor() and inst_id = my_linked_id());
create policy students_self_read on students for select
  using (auth_user_id = auth.uid());
create policy students_self_update on students for update
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- ── vehicles ────────────────────────────────────────────────────────────────
create policy vehicles_read      on vehicles for select using (auth.uid() is not null);
create policy vehicles_admin_all on vehicles for all using (is_admin()) with check (is_admin());

-- ── lessons ─────────────────────────────────────────────────────────────────
create policy lessons_admin_all on lessons for all using (is_admin()) with check (is_admin());
-- instructor: read + manage lessons assigned to them
create policy lessons_instructor_read on lessons for select
  using (is_instructor() and inst_id = my_linked_id());
create policy lessons_instructor_write on lessons for update
  using (is_instructor() and inst_id = my_linked_id())
  with check (is_instructor() and inst_id = my_linked_id());
-- student: read own lessons
create policy lessons_student_read on lessons for select
  using (student_id = my_linked_id());

-- ── invoices ────────────────────────────────────────────────────────────────
create policy invoices_admin_all on invoices for all using (is_admin()) with check (is_admin());
create policy invoices_student_read on invoices for select
  using (student_id = my_linked_id());

-- ── staff (HR) ──────────────────────────────────────────────────────────────
create policy staff_admin_all on staff for all using (is_admin()) with check (is_admin());

-- ── lesson_progress ─────────────────────────────────────────────────────────
create policy lesson_progress_admin_all on lesson_progress for all
  using (is_admin()) with check (is_admin());
-- student: read own progress
create policy lesson_progress_student_read on lesson_progress for select
  using (student_id = my_linked_id());
-- instructor: read + write progress of their own students
create policy lesson_progress_instructor_all on lesson_progress for all
  using (is_instructor() and exists (
    select 1 from students s where s.id = lesson_progress.student_id and s.inst_id = my_linked_id()))
  with check (is_instructor() and exists (
    select 1 from students s where s.id = lesson_progress.student_id and s.inst_id = my_linked_id()));

-- ── vehicle_inspections ─────────────────────────────────────────────────────
create policy inspections_admin_all on vehicle_inspections for all
  using (is_admin()) with check (is_admin());
-- instructor: read + create inspections
create policy inspections_instructor_read on vehicle_inspections for select
  using (is_instructor());
create policy inspections_instructor_write on vehicle_inspections for insert
  with check (is_instructor());
create policy inspections_instructor_update on vehicle_inspections for update
  using (is_instructor()) with check (is_instructor());

-- ── lesson_content (curriculum) ─────────────────────────────────────────────
create policy lesson_content_read      on lesson_content for select using (auth.uid() is not null);
create policy lesson_content_admin_all on lesson_content for all using (is_admin()) with check (is_admin());

-- ── attendance ──────────────────────────────────────────────────────────────
create policy attendance_admin_all on attendance for all using (is_admin()) with check (is_admin());

-- ── announcements ───────────────────────────────────────────────────────────
create policy announcements_read on announcements for select using (auth.uid() is not null);
create policy announcements_staff_write on announcements for insert
  with check (is_admin() or is_instructor());
create policy announcements_admin_all on announcements for all using (is_admin()) with check (is_admin());

-- ── notifications ───────────────────────────────────────────────────────────
create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_own_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_admin_all on notifications for all using (is_admin()) with check (is_admin());

-- ── school_settings ─────────────────────────────────────────────────────────
create policy settings_read      on school_settings for select using (auth.uid() is not null);
create policy settings_admin_all on school_settings for all using (is_admin()) with check (is_admin());
