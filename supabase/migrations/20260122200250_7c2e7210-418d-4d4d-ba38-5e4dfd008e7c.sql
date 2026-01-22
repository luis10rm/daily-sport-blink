-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Policy: admins and editors can upload post images
CREATE POLICY "Admins and editors can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  public.is_admin_or_editor(auth.uid())
);

-- Policy: admins and editors can update post images
CREATE POLICY "Admins and editors can update post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' AND
  public.is_admin_or_editor(auth.uid())
);

-- Policy: admins and editors can delete post images
CREATE POLICY "Admins and editors can delete post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  public.is_admin_or_editor(auth.uid())
);

-- Policy: anyone can view post images (public bucket)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');