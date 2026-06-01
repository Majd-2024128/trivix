-- Lock down wallpapers bucket: make it private and scope all ops to user-owned folders.
UPDATE storage.buckets SET public = false WHERE id = 'wallpapers';

DROP POLICY IF EXISTS "Wallpapers are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload wallpapers" ON storage.objects;

CREATE POLICY "Users can read their own wallpapers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload to their own wallpaper folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own wallpapers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own wallpapers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);