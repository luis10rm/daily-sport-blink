-- Create tags table for programmatic SEO
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast slug lookup
CREATE INDEX idx_tags_slug ON public.tags(slug);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS policies: public read, admin manage
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert tags" ON public.tags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tags" ON public.tags FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tags" ON public.tags FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate slug from Polish text
CREATE OR REPLACE FUNCTION public.generate_tag_slug(tag_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace(
        translate(tag_name, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszżACELNOSZZ'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
$$;

-- Function to sync tags from posts
CREATE OR REPLACE FUNCTION public.sync_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new tags and update existing ones
  INSERT INTO tags (name, slug, post_count)
  SELECT 
    tag,
    generate_tag_slug(tag),
    count(*)::integer
  FROM posts, unnest(tags) AS tag
  WHERE tags IS NOT NULL AND published_at <= now()
  GROUP BY tag
  ON CONFLICT (name) DO UPDATE SET
    post_count = EXCLUDED.post_count,
    updated_at = now();
    
  -- Update counts for tags that might have decreased
  UPDATE tags t SET 
    post_count = COALESCE((
      SELECT count(*)::integer 
      FROM posts p 
      WHERE t.name = ANY(p.tags) AND p.published_at <= now()
    ), 0),
    updated_at = now()
  WHERE NOT EXISTS (
    SELECT 1 FROM posts, unnest(tags) AS tag 
    WHERE tag = t.name AND published_at <= now()
  );
END;
$$;

-- Trigger to auto-sync tags when posts change
CREATE OR REPLACE FUNCTION public.trigger_sync_tags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM sync_tags();
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_tags_on_post_change
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_sync_tags();

-- Initial sync
SELECT sync_tags();