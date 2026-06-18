-- 1. Ensure the 'profiles' bucket exists (Run this if you haven't created it in the UI)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;

-- 3. Policy: Allow anyone to SEE profile pictures (Public Read)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access Profiles" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

-- 4. Policy: Allow logged-in users to UPLOAD pictures
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' 
    AND auth.role() = 'authenticated'
  );

-- 5. Policy: Allow logged-in users to UPDATE/OVERWRITE their pictures
CREATE POLICY "Authenticated Update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' 
    AND auth.role() = 'authenticated'
  );
