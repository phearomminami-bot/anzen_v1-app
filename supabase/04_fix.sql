-- ============================================================================
-- Anzen — fix (04_fix.sql)
-- Run this in the Supabase SQL editor to patch the schema.
--
-- Fix #1: vehicle_inspections was missing the `extra jsonb` column that every
--         other table has (the app stores the full inspection object there).
-- ============================================================================

alter table vehicle_inspections
  add column if not exists extra jsonb not null default '{}';
