-- Upublicznienie bucketa banners
UPDATE storage.buckets 
SET public = true 
WHERE id = 'banners';

-- Polityka dla publicznego odczytu banerów
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Polityka dla uploadu przez adminów/edytorów
CREATE POLICY "Admins and editors can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Polityka dla aktualizacji przez adminów/edytorów
CREATE POLICY "Admins and editors can update banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' 
  AND public.is_admin_or_editor(auth.uid())
);

-- Polityka dla usuwania przez adminów/edytorów
CREATE POLICY "Admins and editors can delete banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND public.is_admin_or_editor(auth.uid())
);