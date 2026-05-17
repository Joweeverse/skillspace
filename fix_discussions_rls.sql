-- ==========================================
-- 1. Create Discussions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

-- Anyone can view discussions (to see questions and answers)
CREATE POLICY "Discussions are viewable by everyone" 
  ON public.discussions FOR SELECT USING (true);

-- Authenticated users can post messages
CREATE POLICY "Authenticated users can post discussions" 
  ON public.discussions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" 
  ON public.discussions FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. Fix missing Question policy for students (if not done)
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'questions' AND policyname = 'Enrolled students can view questions'
    ) THEN
        CREATE POLICY "Enrolled students can view questions" ON public.questions
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM public.quizzes
              JOIN public.lessons ON quizzes.lesson_id = lessons.id
              JOIN public.enrollments ON lessons.course_id = enrollments.course_id
              WHERE quizzes.id = questions.quiz_id
                AND enrollments.student_id = auth.uid()
            )
          );
    END IF;
END $$;
