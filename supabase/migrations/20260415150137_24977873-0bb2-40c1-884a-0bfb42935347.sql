
-- Create storage bucket for wallpaper uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('wallpapers', 'wallpapers', true);

-- Anyone can view wallpapers
CREATE POLICY "Wallpapers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'wallpapers');

-- Authenticated users can upload wallpapers
CREATE POLICY "Authenticated users can upload wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wallpapers' AND auth.role() = 'authenticated');
