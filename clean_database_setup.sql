-- ==========================================
-- CLEAN SLATE: DROP EVERYTHING FIRST
-- ==========================================
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop tables (order matters because of foreign keys)
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.user_role CASCADE;

-- ==========================================
-- 1. SETUP TYPES & TABLES
-- ==========================================

-- Enum for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'mentor', 'admin');

-- Profiles table (linked to Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role public.user_role DEFAULT 'student' NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  youtube_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE public.enrollments (
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  completed_lessons UUID[] DEFAULT '{}',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (student_id, course_id)
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. AUTH SYNC TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses Policies
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Mentors can create courses" ON public.courses FOR INSERT WITH CHECK (
  auth.uid() = mentor_id AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "Mentors can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = mentor_id);
CREATE POLICY "Mentors can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = mentor_id);

-- Lessons Policies
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Mentors can manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = lessons.course_id AND mentor_id = auth.uid())
);

-- Enrollments Policies
CREATE POLICY "Students can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own progress" ON public.enrollments FOR UPDATE USING (auth.uid() = student_id);

-- Quizzes & Questions Policies
CREATE POLICY "Viewable by enrolled students" ON public.quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.lessons JOIN public.enrollments ON lessons.course_id = enrollments.course_id WHERE lessons.id = quizzes.lesson_id AND enrollments.student_id = auth.uid())
);
CREATE POLICY "Mentors can manage quizzes" ON public.quizzes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.lessons JOIN public.courses ON lessons.course_id = courses.id WHERE lessons.id = quizzes.lesson_id AND courses.mentor_id = auth.uid())
);
CREATE POLICY "Mentors can manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.quizzes JOIN public.lessons JOIN public.courses ON lessons.course_id = courses.id WHERE quizzes.id = questions.quiz_id AND courses.mentor_id = auth.uid())
);
