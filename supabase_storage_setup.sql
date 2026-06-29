-- Anzen — Supabase Storage setup (run ONCE in the Supabase SQL editor)
-- Creates a public "media" bucket and lets the app (anon/publishable key)
-- upload to it and read from it. This moves photos / document scans out of
-- the database rows so they no longer count toward egress on every load.

-- 1) Public bucket named "media"
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- 2) Access policies on storage.objects for the media bucket.
--    The app signs requests with the anon/publishable key, so allow that role.
drop policy if exists "anzen media read"   on storage.objects;
drop policy if exists "anzen media insert" on storage.objects;
drop policy if exists "anzen media update" on storage.objects;

create policy "anzen media read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "anzen media insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'media');

create policy "anzen media update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- Done. New photo / document uploads now go to Storage and the DB rows keep
-- only the URL. Existing inline (base64) images keep working; re-upload them
-- when convenient to shrink the database.
