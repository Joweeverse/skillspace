-- This script fixes Row-Level Security (RLS) for lesson materials and PDF storage.

-- 1. Ensure Mentors can MANAGE (Insert/Update/Delete) lessons for their own courses
-- Note: 'lessons.course_id' might need a table alias depending on your DB version,
-- but this syntax is standard for Supabase policies.
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
-- These policies allow Mentors to upload/update/delete PDFs and anyone to view them.

-- Policy: Allow public to view (download) materials
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING ( bucket_id = 'materials' );

-- Policy: Allow Mentors to upload materials
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
CREATE POLICY "Mentors can manage materials" ON storage.objects
FOR ALL USING (
  bucket_id = 'materials' 
  AND (auth.role() = 'authenticated')
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'mentor'
  )
);
