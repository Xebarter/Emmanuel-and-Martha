# Wedding Website Gallery & Setup

This document outlines the setup process for the wedding website, including gallery configuration and payment integration.

## Gallery Setup

The gallery uses Supabase Storage for storing and serving images. The setup includes:

1. Creating a gallery table in the database
2. Setting up storage buckets for images
3. Configuring access policies

## Payment Integration

The website now supports payments through Pesapal. To enable this functionality, you need to configure the following environment variables:

```env
VITE_PESAPAL_API_URL=https://pay.pesapal.com
VITE_PESAPAL_CONSUMER_KEY=your_consumer_key_here
VITE_PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
VITE_PESAPAL_IPN_ID=your_ipn_id_here
VITE_PESAPAL_IPN_URL=https://yourdomain.com/ipn
VITE_PESAPAL_CALLBACK_URL=https://yourdomain.com/callback
VITE_PESAPAL_CANCEL_URL=https://yourdomain.com/cancel
```

These variables have been configured with your provided credentials.

## Routes

The application includes the following routes for payment handling:

- `/callback` - Handles successful payments
- `/cancel` - Handles cancelled payments 
- `/ipn` - Handles Instant Payment Notifications from Pesapal

Users can make contributions through the "Contribute to Our Celebration" section, which now redirects them to Pesapal for payment processing.

## Prerequisites

1. Supabase project with the following:
   - A table named `gallery`
   - A storage bucket named `gallery`
   - Appropriate Row Level Security (RLS) policies

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=gallery
```

### 2. Database Setup

Run the following SQL in your Supabase SQL editor to set up the required database tables and policies:

```sql
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

-- Similar update and delete policies...

-- Create a storage bucket for gallery images
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- Set up storage policies for the gallery bucket
create policy "Allow public read access to gallery bucket"
on storage.objects for select
using (bucket_id = 'gallery');

-- More storage policies...
```

### 3. Storage Configuration

1. Go to the Supabase dashboard
2. Navigate to Storage > Policies
3. Ensure the following policies are in place for the `gallery` bucket:
   - Public read access
   - Authenticated users with admin role can upload, update, and delete files

### 4. Testing

1. Log in to the admin dashboard
2. Navigate to the Gallery section
3. Try uploading an image with a title and description
4. Verify the image appears in the public gallery
5. Test deleting an image

## Troubleshooting

- **Upload Failing**: Check browser console for errors and verify CORS settings in Supabase
- **Images Not Displaying**: Ensure the storage bucket is public and the URL is correct
- **Permission Denied**: Verify the user has the 'admin' role in their user_metadata

## Security Notes

- Always keep your Supabase anon key secure
- Never expose service role keys in client-side code
- Regularly review and update RLS policies as needed
