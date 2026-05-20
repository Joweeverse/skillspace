-- 1. Create a table for certificate configurations
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_url TEXT, -- If they upload a background
    title_text TEXT DEFAULT 'Sertifikat Kelulusan',
    description_text TEXT DEFAULT 'Dengan ini menyatakan bahwa',
    signature_name TEXT,
    primary_color TEXT DEFAULT '#2563eb', -- Blue-600
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id)
);

-- 2. Add RLS for certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view certificates
CREATE POLICY "Public can view certificates" ON public.certificates
FOR SELECT USING (true);

-- Allow mentors to manage their own course certificates
CREATE POLICY "Mentors can manage their own certificates" ON public.certificates
FOR ALL USING (
    auth.uid() = mentor_id
)
WITH CHECK (
    auth.uid() = mentor_id
);

-- 3. Storage bucket for certificate templates
-- Note: User must create this bucket manually in dashboard too
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificate templates
CREATE POLICY "Public Access Certificates" ON storage.objects
FOR SELECT USING ( bucket_id = 'certificates' );

CREATE POLICY "Mentors can upload certificate templates" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certificates' 
  AND (auth.role() = 'authenticated')
);

CREATE POLICY "Mentors can manage certificate templates" ON storage.objects
FOR ALL USING (
  bucket_id = 'certificates' 
  AND (auth.role() = 'authenticated')
);
