-- 1. Add points column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. Create function to distribute points
CREATE OR REPLACE FUNCTION public.handle_mentor_points()
RETURNS TRIGGER AS $$
DECLARE
    target_mentor_id UUID;
    points_to_add INTEGER := 0;
BEGIN
    -- Get the mentor ID for the course
    SELECT mentor_id INTO target_mentor_id 
    FROM public.courses 
    WHERE id = NEW.course_id;

    -- Case A: New Enrollment (Add 10 points)
    IF (TG_OP = 'INSERT') THEN
        points_to_add := 10;
    END IF;

    -- Case B: Course Completed (Add 50 points)
    -- Assuming status changes from 'enrolled' to 'completed'
    IF (TG_OP = 'UPDATE' AND OLD.status = 'enrolled' AND NEW.status = 'completed') THEN
        points_to_add := 50;
    END IF;

    -- Update mentor points if we have a mentor and points to add
    IF (target_mentor_id IS NOT NULL AND points_to_add > 0) THEN
        UPDATE public.profiles 
        SET points = points + points_to_add
        WHERE id = target_mentor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create triggers on enrollments table
DROP TRIGGER IF EXISTS on_course_enrollment ON public.enrollments;
CREATE TRIGGER on_course_enrollment
    AFTER INSERT ON public.enrollments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_mentor_points();

DROP TRIGGER IF EXISTS on_course_completion ON public.enrollments;
CREATE TRIGGER on_course_completion
    AFTER UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_mentor_points();
