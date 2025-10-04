-- Create storage policies for gallery bucket
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Allow public read access to gallery bucket
create policy "Allow public read access"
on storage.objects for select
using (bucket_id = 'gallery');

-- Allow authenticated users with admin role to upload to gallery bucket
create policy "Allow admin uploads"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gallery' 
  and auth.role() = 'authenticated'
  and (
    select raw_user_meta_data->>'role' = 'admin'
    from auth.users
    where auth.uid() = id
  )
);

-- Allow admin users to update their uploaded files
create policy "Allow admin updates"
on storage.objects for update
to authenticated
using (
  bucket_id = 'gallery'
  and auth.role() = 'authenticated'
  and (
    select raw_user_meta_data->>'role' = 'admin'
    from auth.users
    where auth.uid() = id
  )
);

-- Allow admin users to delete their uploaded files
create policy "Allow admin deletes"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gallery'
  and auth.role() = 'authenticated'
  and (
    select raw_user_meta_data->>'role' = 'admin'
    from auth.users
    where auth.uid() = id
  )
);