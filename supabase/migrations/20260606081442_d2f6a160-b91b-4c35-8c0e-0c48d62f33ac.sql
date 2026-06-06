
CREATE OR REPLACE FUNCTION public.sync_tags_for_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text;
  new_tags text[];
  old_tags text[];
  new_published boolean;
  old_published boolean;
BEGIN
  new_published := (TG_OP IN ('INSERT','UPDATE')) AND NEW.tags IS NOT NULL AND NEW.published_at IS NOT NULL AND NEW.published_at <= now();
  old_published := (TG_OP IN ('UPDATE','DELETE')) AND OLD.tags IS NOT NULL AND OLD.published_at IS NOT NULL AND OLD.published_at <= now();

  new_tags := CASE WHEN new_published THEN NEW.tags ELSE ARRAY[]::text[] END;
  old_tags := CASE WHEN old_published THEN OLD.tags ELSE ARRAY[]::text[] END;

  -- Tags added (in new, not in old)
  FOREACH t IN ARRAY new_tags LOOP
    IF NOT (t = ANY(old_tags)) THEN
      BEGIN
        INSERT INTO tags (name, slug, post_count)
        VALUES (t, generate_tag_slug(t), 1)
        ON CONFLICT (name) DO UPDATE SET
          post_count = tags.post_count + 1,
          updated_at = now();
      EXCEPTION WHEN unique_violation THEN
        UPDATE tags SET post_count = post_count + 1, updated_at = now()
        WHERE slug = generate_tag_slug(t);
      END;
    END IF;
  END LOOP;

  -- Tags removed (in old, not in new)
  FOREACH t IN ARRAY old_tags LOOP
    IF NOT (t = ANY(new_tags)) THEN
      UPDATE tags SET post_count = GREATEST(post_count - 1, 0), updated_at = now()
      WHERE name = t;
    END IF;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_tags_on_post_change ON public.posts;

CREATE TRIGGER sync_tags_on_post_change
AFTER INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_tags_for_row();
