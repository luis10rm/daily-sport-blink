-- Rozszerzenie tabeli profiles o pola dla profili autorów
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS role_title text DEFAULT 'Autor',
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_twitter text,
ADD COLUMN IF NOT EXISTS social_instagram text;

-- Indeks dla szybkiego wyszukiwania po slug
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Polityka RLS dla publicznego dostępu do profili autorów
CREATE POLICY "Anyone can view public profiles" ON profiles
FOR SELECT USING (is_public = true);

-- Bucket dla obrazów autorów (avatary i cover images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('author-images', 'author-images', true)
ON CONFLICT (id) DO NOTHING;

-- Polityki RLS dla bucketu author-images
CREATE POLICY "Anyone can view author images"
ON storage.objects FOR SELECT
USING (bucket_id = 'author-images');

CREATE POLICY "Admins and editors can upload author images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'author-images' 
  AND is_admin_or_editor(auth.uid())
);

CREATE POLICY "Admins and editors can update author images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'author-images' 
  AND is_admin_or_editor(auth.uid())
);

CREATE POLICY "Admins and editors can delete author images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'author-images' 
  AND is_admin_or_editor(auth.uid())
);