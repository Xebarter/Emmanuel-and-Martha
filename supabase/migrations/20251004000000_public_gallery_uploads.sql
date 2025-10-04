-- Allow public uploads to gallery bucket
-- This script modifies the storage policies to allow anyone to upload images to the gallery

-- First, make sure the gallery bucket exists
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public;

-- Remove existing policies for gallery bucket
drop policy if exists "Allow public read access" on storage.objects;
drop policy if exists "Allow admin uploads" on storage.objects;
drop policy if exists "Allow admin updates" on storage.objects;
drop policy if exists "Allow admin deletes" on storage.objects;

-- Create new policies that allow public read and uploads
create policy "Allow public read access to gallery"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "Allow public uploads to gallery"
on storage.objects for insert
with check (
  bucket_id = 'gallery'
);

create policy "Allow public updates to their own gallery uploads"
on storage.objects for update
using (
  bucket_id = 'gallery'
);

create policy "Allow public deletes to their own gallery uploads"
on storage.objects for delete
using (
  bucket_id = 'gallery'
);

-- Also update the gallery table policies to allow public inserts
drop policy if exists "Public can view gallery" on gallery;
drop policy if exists "Admins can manage gallery" on gallery;

create policy "Public can view gallery"
on gallery for select
using (true);

create policy "Public can add to gallery"
on gallery for insert
with check (true);

create policy "Public can update their gallery entries"
on gallery for update
using (true);

create policy "Public can delete their gallery entries"
on gallery for delete
using (true);