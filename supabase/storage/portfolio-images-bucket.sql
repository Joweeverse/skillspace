-- Storage: Create the portfolio-images bucket and RLS policies
-- Run this in the Supabase SQL editor.

-- 1. Create the public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  2097152,  -- 2 MB limit enforced at bucket level
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Anyone can read objects (public read)
CREATE POLICY "Public read portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

-- 3. Authenticated users can upload into their own folder only
--    Path must be: {userId}/{filename}
CREATE POLICY "Authenticated upload portfolio own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Authenticated users can update their own objects
CREATE POLICY "Authenticated update portfolio own objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Authenticated users can delete their own objects
CREATE POLICY "Authenticated delete portfolio own objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
