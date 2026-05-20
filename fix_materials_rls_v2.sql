-- This script robustly fixes Row-Level Security (RLS) for lesson materials and PDF storage.
-- It handles existing policies to avoid "already exists" errors.

-- 1. Fix Database Policies for the 'lessons' table
-- Ensures mentors can fully manage (Insert/Update/Delete) lessons in their own courses.
DROP POLICY IF EXISTS "Mentors can manage lessons" ON public.lessons;

CREATE POLICY "Mentors can manage lessons" ON public.lessons 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE public.courses.id = public.lessons.course_id 
    AND public.courses.mentor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE public.courses.id = public.lessons.course_id 
    AND public.courses.mentor_id = auth.uid()
  )
);

-- 2. Storage Policies for the 'materials' bucket
-- Note: Supabase storage policies are on the 'storage.objects' table.

-- Policy: Allow public to view (download) materials
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING ( bucket_id = 'materials' );

-- Policy: Allow Mentors to upload materials
DROP POLICY IF EXISTS "Mentors can upload materials" ON storage.objects;
CREATE POLICY "Mentors can upload materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'materials' 
  AND (auth.role() = 'authenticated')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'mentor'
  )
);

-- Policy: Allow Mentors to update/delete materials
DROP POLICY IF EXISTS "Mentors can manage materials" ON storage.objects;
CREATE POLICY "Mentors can manage materials" ON storage.objects
FOR ALL USING (
  bucket_id = 'materials' 
  AND (auth.role() = 'authenticated')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'mentor'
  )
);
