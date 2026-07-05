
-- 1. Channel column on posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sport';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_channel_check;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_channel_check CHECK (channel IN ('sport','positive'));

CREATE INDEX IF NOT EXISTS posts_channel_published_at_idx
  ON public.posts (channel, published_at DESC);

-- 2. positive_categories (mirror of sport_categories)
CREATE TABLE IF NOT EXISTS public.positive_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon_name text,
  icon_url text,
  bg_color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.positive_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.positive_categories TO authenticated;
GRANT ALL ON public.positive_categories TO service_role;

ALTER TABLE public.positive_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active positive categories" ON public.positive_categories;
CREATE POLICY "Public can view active positive categories"
  ON public.positive_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin/editor can view all positive categories" ON public.positive_categories;
CREATE POLICY "Admin/editor can view all positive categories"
  ON public.positive_categories FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admin/editor can insert positive categories" ON public.positive_categories;
CREATE POLICY "Admin/editor can insert positive categories"
  ON public.positive_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admin/editor can update positive categories" ON public.positive_categories;
CREATE POLICY "Admin/editor can update positive categories"
  ON public.positive_categories FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admin/editor can delete positive categories" ON public.positive_categories;
CREATE POLICY "Admin/editor can delete positive categories"
  ON public.positive_categories FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

DROP TRIGGER IF EXISTS positive_categories_set_updated_at ON public.positive_categories;
CREATE TRIGGER positive_categories_set_updated_at
  BEFORE UPDATE ON public.positive_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Positive category FK on posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS positive_category_id uuid REFERENCES public.positive_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_positive_category_id_idx
  ON public.posts (positive_category_id);

-- 4. Channel on news_suggestions + news_sources
ALTER TABLE public.news_suggestions
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sport';
ALTER TABLE public.news_suggestions
  DROP CONSTRAINT IF EXISTS news_suggestions_channel_check;
ALTER TABLE public.news_suggestions
  ADD CONSTRAINT news_suggestions_channel_check CHECK (channel IN ('sport','positive'));

ALTER TABLE public.news_sources
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sport';
ALTER TABLE public.news_sources
  DROP CONSTRAINT IF EXISTS news_sources_channel_check;
ALTER TABLE public.news_sources
  ADD CONSTRAINT news_sources_channel_check CHECK (channel IN ('sport','positive'));

-- 5. Channel on tags (multi-channel taxonomy)
ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sport';
ALTER TABLE public.tags
  DROP CONSTRAINT IF EXISTS tags_channel_check;
ALTER TABLE public.tags
  ADD CONSTRAINT tags_channel_check CHECK (channel IN ('sport','positive'));

-- Adjust uniqueness: (channel, name) and (channel, slug)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_name_key') THEN
    ALTER TABLE public.tags DROP CONSTRAINT tags_name_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_slug_key') THEN
    ALTER TABLE public.tags DROP CONSTRAINT tags_slug_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS tags_channel_name_key ON public.tags (channel, name);
CREATE UNIQUE INDEX IF NOT EXISTS tags_channel_slug_key ON public.tags (channel, slug);

-- 6. Update sync_tags* to be channel-aware
CREATE OR REPLACE FUNCTION public.sync_tags()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tag_record RECORD;
BEGIN
  FOR tag_record IN
    SELECT
      COALESCE(p.channel, 'sport') as channel,
      tag as name,
      generate_tag_slug(tag) as slug,
      count(*)::integer as post_count
    FROM posts p, unnest(p.tags) AS tag
    WHERE p.tags IS NOT NULL AND p.published_at <= now()
    GROUP BY p.channel, tag
  LOOP
    BEGIN
      INSERT INTO tags (channel, name, slug, post_count)
      VALUES (tag_record.channel, tag_record.name, tag_record.slug, tag_record.post_count)
      ON CONFLICT (channel, name) DO UPDATE SET
        post_count = EXCLUDED.post_count,
        updated_at = now();
    EXCEPTION WHEN unique_violation THEN
      UPDATE tags SET
        post_count = tags.post_count + tag_record.post_count,
        updated_at = now()
      WHERE channel = tag_record.channel AND slug = tag_record.slug;
    END;
  END LOOP;

  UPDATE tags t SET
    post_count = COALESCE((
      SELECT count(*)::integer
      FROM posts p
      WHERE COALESCE(p.channel,'sport') = t.channel
        AND t.name = ANY(p.tags)
        AND p.published_at <= now()
    ), 0),
    updated_at = now()
  WHERE t.id IS NOT NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_tags_for_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t text;
  new_tags text[];
  old_tags text[];
  new_published boolean;
  old_published boolean;
  new_channel text;
  old_channel text;
BEGIN
  new_published := (TG_OP IN ('INSERT','UPDATE')) AND NEW.tags IS NOT NULL AND NEW.published_at IS NOT NULL AND NEW.published_at <= now();
  old_published := (TG_OP IN ('UPDATE','DELETE')) AND OLD.tags IS NOT NULL AND OLD.published_at IS NOT NULL AND OLD.published_at <= now();

  new_channel := COALESCE(NEW.channel, 'sport');
  old_channel := COALESCE(OLD.channel, 'sport');

  new_tags := CASE WHEN new_published THEN NEW.tags ELSE ARRAY[]::text[] END;
  old_tags := CASE WHEN old_published THEN OLD.tags ELSE ARRAY[]::text[] END;

  FOREACH t IN ARRAY new_tags LOOP
    IF NOT (t = ANY(old_tags)) OR new_channel <> old_channel THEN
      BEGIN
        INSERT INTO tags (channel, name, slug, post_count)
        VALUES (new_channel, t, generate_tag_slug(t), 1)
        ON CONFLICT (channel, name) DO UPDATE SET
          post_count = tags.post_count + 1,
          updated_at = now();
      EXCEPTION WHEN unique_violation THEN
        UPDATE tags SET post_count = post_count + 1, updated_at = now()
        WHERE channel = new_channel AND slug = generate_tag_slug(t);
      END;
    END IF;
  END LOOP;

  FOREACH t IN ARRAY old_tags LOOP
    IF NOT (t = ANY(new_tags)) OR new_channel <> old_channel THEN
      UPDATE tags SET post_count = GREATEST(post_count - 1, 0), updated_at = now()
      WHERE channel = old_channel AND name = t;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 7. Seed positive categories
INSERT INTO public.positive_categories (slug, name, icon_name, bg_color, sort_order)
VALUES
  ('nauka',   'Nauka',    'FlaskConical', '#84cc16', 10),
  ('ludzie',  'Ludzie',   'Users',        '#a3e635', 20),
  ('natura',  'Natura',   'Leaf',         '#65a30d', 30),
  ('miasta',  'Miasta',   'Building2',    '#4d7c0f', 40),
  ('zdrowie', 'Zdrowie',  'HeartPulse',   '#bef264', 50),
  ('swiat',   'Świat',    'Globe',        '#a3e635', 60)
ON CONFLICT (slug) DO NOTHING;
