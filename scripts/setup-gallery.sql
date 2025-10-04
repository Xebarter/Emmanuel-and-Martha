-- Create gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery table
CREATE POLICY "Enable read access for all users" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.gallery
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.gallery
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.gallery
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (name) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE TO authenticated USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE TO authenticated USING (auth.uid() = owner);
