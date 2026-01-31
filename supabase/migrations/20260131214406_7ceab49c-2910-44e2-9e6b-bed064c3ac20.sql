-- Add slug column to posts table
ALTER TABLE public.posts 
ADD COLUMN slug text;

-- Create unique index on slug (allows NULL for migration period)
CREATE UNIQUE INDEX idx_posts_slug ON public.posts(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from title (Polish transliteration)
CREATE OR REPLACE FUNCTION public.generate_post_slug(title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        translate(title, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszżACELNOSZZ'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
$$;

-- Populate slugs for existing posts (using title + short id suffix for uniqueness)
UPDATE public.posts 
SET slug = generate_post_slug(title) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE public.posts 
ALTER COLUMN slug SET NOT NULL;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_post_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_post_slug(NEW.title) || '-' || substring(NEW.id::text from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_generate_post_slug
BEFORE INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_post_slug();