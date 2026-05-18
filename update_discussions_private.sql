-- Add private discussion support with explicit FK names
ALTER TABLE public.discussions ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- CLEANUP: Delete any orphaned discussions that don't have a matching profile
-- This prevents the foreign key constraint error you encountered
DELETE FROM public.discussions 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Ensure columns exist and have the correct constraints with explicit names
DO $$ 
BEGIN
    -- For user_id (sender)
    ALTER TABLE public.discussions 
    DROP CONSTRAINT IF EXISTS discussions_user_id_fkey,
    ADD CONSTRAINT discussions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    -- For recipient_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'discussions_recipient_id_fkey') THEN
        ALTER TABLE public.discussions 
        ADD COLUMN IF NOT EXISTS recipient_id UUID,
        ADD CONSTRAINT discussions_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update RLS policies for discussions
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON public.discussions;
DROP POLICY IF EXISTS "Authenticated users can post discussions" ON public.discussions;
DROP POLICY IF EXISTS "Public discussions are viewable by everyone" ON public.discussions;
DROP POLICY IF EXISTS "Private discussions are viewable by authorized parties" ON public.discussions;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.discussions;

-- 1. Public discussions are viewable by everyone
CREATE POLICY "Public discussions are viewable by everyone" 
  ON public.discussions FOR SELECT 
  USING (NOT is_private);

-- 2. Private discussions are viewable by sender, recipient, or course mentor
CREATE POLICY "Private discussions are viewable by authorized parties" 
  ON public.discussions FOR SELECT 
  USING (
    is_private AND (
      auth.uid() = user_id OR 
      auth.uid() = recipient_id OR
      EXISTS (
        SELECT 1 FROM public.courses c
        JOIN public.lessons l ON l.course_id = c.id
        WHERE l.id = discussions.lesson_id AND c.mentor_id = auth.uid()
      )
    )
  );

-- 3. Authenticated users can post (public or private)
CREATE POLICY "Authenticated users can post discussions" 
  ON public.discussions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own
CREATE POLICY "Users can delete their own messages" 
  ON public.discussions FOR DELETE 
  USING (auth.uid() = user_id);
