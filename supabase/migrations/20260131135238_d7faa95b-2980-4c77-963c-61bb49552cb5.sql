-- Fix sync_tags() - add WHERE clause to final UPDATE
CREATE OR REPLACE FUNCTION public.sync_tags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tag_record RECORD;
BEGIN
  -- Process each unique tag from published posts
  FOR tag_record IN 
    SELECT 
      tag as name,
      generate_tag_slug(tag) as slug,
      count(*)::integer as post_count
    FROM posts, unnest(tags) AS tag
    WHERE tags IS NOT NULL AND published_at <= now()
    GROUP BY tag
  LOOP
    BEGIN
      -- Try to insert new tag, on name conflict just update post_count
      INSERT INTO tags (name, slug, post_count)
      VALUES (tag_record.name, tag_record.slug, tag_record.post_count)
      ON CONFLICT (name) DO UPDATE SET
        post_count = EXCLUDED.post_count,
        updated_at = now();
    EXCEPTION WHEN unique_violation THEN
      -- Slug already exists with different name - just update the post_count for existing tag
      UPDATE tags SET 
        post_count = post_count + tag_record.post_count,
        updated_at = now()
      WHERE slug = tag_record.slug;
    END;
  END LOOP;
    
  -- Update counts for all existing tags to ensure accuracy
  UPDATE tags t SET 
    post_count = COALESCE((
      SELECT count(*)::integer 
      FROM posts p 
      WHERE t.name = ANY(p.tags) AND p.published_at <= now()
    ), 0),
    updated_at = now()
  WHERE t.id IS NOT NULL;
END;
$function$;