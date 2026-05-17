-- 1. Add avatar_url to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create a storage bucket for profile pictures (Must be done via Supabase Dashboard or SQL)
-- Note: In Supabase, it's easier to create the bucket 'profiles' manually in the Dashboard.
-- But if you want to use SQL for policies, run these:

-- Policy to allow users to upload their own avatar
-- Replace 'profiles' with your bucket name
CREATE POLICY "Allow public read access to avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');

CREATE POLICY "Allow users to upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profiles' AND 
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Note: The simpler way is to just create a Public Bucket named 'profiles' 
-- in your Supabase Dashboard -> Storage.
