CREATE OR REPLACE FUNCTION public.prevent_post_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_post_slug_change ON public.posts;
CREATE TRIGGER trigger_prevent_post_slug_change
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_post_slug_change();