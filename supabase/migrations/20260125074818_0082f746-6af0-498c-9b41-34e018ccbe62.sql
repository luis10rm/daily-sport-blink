-- Tworzenie tabeli authors
CREATE TABLE public.authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_email TEXT,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  role_title TEXT DEFAULT 'Autor',
  is_public BOOLEAN DEFAULT false,
  social_twitter TEXT,
  social_instagram TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indeksy
CREATE INDEX idx_authors_linked_user_id ON public.authors(linked_user_id);
CREATE INDEX idx_authors_slug ON public.authors(slug);
CREATE INDEX idx_authors_is_public ON public.authors(is_public);

-- RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public authors" ON public.authors
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can do everything" ON public.authors
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their linked profile" ON public.authors
  FOR UPDATE USING (linked_user_id = auth.uid());

-- Migracja danych z profiles (tylko te z uzupełnionymi danymi)
INSERT INTO public.authors (linked_user_id, display_name, slug, bio, avatar_url, cover_image_url, role_title, is_public, social_twitter, social_instagram, created_at, updated_at)
SELECT 
  id,
  COALESCE(display_name, full_name, 'Autor'),
  COALESCE(slug, 'autor-' || substr(id::text, 1, 8)),
  bio,
  avatar_url,
  cover_image_url,
  COALESCE(role_title, 'Autor'),
  COALESCE(is_public, false),
  social_twitter,
  social_instagram,
  created_at,
  updated_at
FROM profiles
WHERE display_name IS NOT NULL OR slug IS NOT NULL;

-- Dodanie author_id do posts
ALTER TABLE public.posts ADD COLUMN author_id UUID REFERENCES public.authors(id);

-- Aktualizacja postów - przypisanie author_id na podstawie created_by
UPDATE public.posts p
SET author_id = a.id
FROM public.authors a
WHERE p.created_by = a.linked_user_id;

-- Trigger do aktualizacji updated_at
CREATE TRIGGER update_authors_updated_at
BEFORE UPDATE ON public.authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();