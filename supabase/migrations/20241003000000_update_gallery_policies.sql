-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to gallery bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow insert for authenticated users with admin role" ON storage.objects;
DROP POLICY IF EXISTS "Allow update for authenticated users with admin role" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete for authenticated users with admin role" ON storage.objects;

-- New policies for the gallery bucket
-- Allow public read access to gallery files
CREATE POLICY "Allow public read access to gallery bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

-- Allow authenticated users with admin role to insert files
CREATE POLICY "Allow insert for authenticated users with admin role"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery' AND 
  (auth.role() = 'authenticated')
);

-- Allow authenticated users with admin role to update files
CREATE POLICY "Allow update for authenticated users with admin role"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery' AND 
  (auth.role() = 'authenticated')
);

-- Allow authenticated users with admin role to delete files
CREATE POLICY "Allow delete for authenticated users with admin role"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery' AND 
  (auth.role() = 'authenticated')
);

-- Update gallery table policies to use auth.role()
DROP POLICY IF EXISTS "Allow insert for authenticated users with admin role" ON public.gallery;
DROP POLICY IF EXISTS "Allow update for authenticated users with admin role" ON public.gallery;
DROP POLICY IF EXISTS "Allow delete for authenticated users with admin role" ON public.gallery;

CREATE POLICY "Allow insert for authenticated users with admin role"
ON public.gallery FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users with admin role"
ON public.gallery FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users with admin role"
ON public.gallery FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');
