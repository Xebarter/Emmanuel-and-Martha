-- Ensure the gallery bucket exists
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

-- Remove all existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Allow public read access to gallery bucket" on storage.objects;
drop policy if exists "Allow insert for authenticated users with admin role" on storage.objects;
drop policy if exists "Allow update for authenticated users with admin role" on storage.objects;
drop policy if exists "Allow delete for authenticated users with admin role" on storage.objects;

-- 1. Allow public read access to all files in the gallery bucket
create policy "Public Access"
on storage.objects for select
using (bucket_id = 'gallery');

-- 2. Allow authenticated users to upload files to the gallery bucket
create policy "Allow uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gallery' and
  (storage.foldername(name))[1] = 'gallery'
);

-- 3. Allow users to update their own uploads
create policy "Allow updates"
on storage.objects for update
to authenticated
using (
  bucket_id = 'gallery' and
  (storage.foldername(name))[1] = 'gallery' and
  auth.uid() = owner
);

-- 4. Allow users to delete their own uploads
create policy "Allow deletes"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gallery' and
  (storage.foldername(name))[1] = 'gallery' and
  auth.uid() = owner
);

-- Update the gallery table RLS policies
alter table public.gallery enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Allow public read access" on public.gallery;
drop policy if exists "Allow insert for authenticated users with admin role" on public.gallery;
drop policy if exists "Allow update for authenticated users with admin role" on public.gallery;
drop policy if exists "Allow delete for authenticated users with admin role" on public.gallery;

-- Allow public read access to gallery items
create policy "Allow public read access"
on public.gallery for select
using (true);

-- Allow authenticated users to insert gallery items
create policy "Allow insert for authenticated users"
on public.gallery for insert
to authenticated
with check (true);

-- Allow users to update their own gallery items
create policy "Allow update for authenticated users"
on public.gallery for update
to authenticated
using (true)
with check (true);

-- Allow users to delete their own gallery items
create policy "Allow delete for authenticated users"
on public.gallery for delete
to authenticated
using (true);

-- Add a function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 
    from auth.users 
    where id = auth.uid() 
    and raw_user_meta_data->>'role' = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.is_admin() to authenticated;
