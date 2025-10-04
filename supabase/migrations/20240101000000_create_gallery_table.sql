-- Create gallery table
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.gallery enable row level security;

-- Create policies for gallery table
create policy "Allow public read access"
on public.gallery for select
using (true);

create policy "Allow insert for authenticated users with admin role"
on public.gallery for insert
to authenticated
with check (
  exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'role' = 'admin'
  )
);

create policy "Allow update for authenticated users with admin role"
on public.gallery for update
to authenticated
using (
  exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'role' = 'admin'
  )
);

create policy "Allow delete for authenticated users with admin role"
on public.gallery for delete
to authenticated
using (
  exists (
    select 1 from auth.users
    where auth.uid() = id and raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create a function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create a trigger to update the updated_at column
create or replace trigger update_gallery_updated_at
before update on public.gallery
for each row
execute function update_updated_at_column();

-- Create a storage bucket for gallery images
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Set up storage policies for the gallery bucket
create policy "Allow public read access to gallery bucket"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "Allow insert for authenticated users with admin role"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gallery' and
  (auth.uid() is not null) and
  (auth.jwt() ->> 'role' = 'admin')
);

create policy "Allow update for authenticated users with admin role"
on storage.objects for update
to authenticated
using (
  bucket_id = 'gallery' and
  (auth.uid() is not null) and
  (auth.jwt() ->> 'role' = 'admin')
);

create policy "Allow delete for authenticated users with admin role"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gallery' and
  (auth.uid() is not null) and
  (auth.jwt() ->> 'role' = 'admin')
);
