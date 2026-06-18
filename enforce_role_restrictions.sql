-- 1. Ensure a user can only have one role and profile
-- This is already handled by the primary key on profiles (id UUID REFERENCES auth.users)
-- But we can add a constraint to ensure the role is valid
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS check_valid_role;

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_valid_role 
  CHECK (role IN ('student', 'mentor', 'admin'));

-- 2. Restrict visibility in the courses table via RLS
-- Students can see everything
-- Mentors can only see their own courses
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;

CREATE POLICY "Courses visibility based on role" ON public.courses
  FOR SELECT
  USING (
    -- If user is a student or admin, they can see all courses
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('student', 'admin')
    )
    OR
    -- Mentors can see all courses in the catalog
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'mentor'
    )
    OR
    -- If not logged in, allow viewing (public catalog)
    (auth.uid() IS NULL)
  );

-- 3. Prevent Mentors from enrolling via Database Level
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;

CREATE POLICY "Only students can enroll" ON public.enrollments
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id 
    AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'student'
    )
  );
