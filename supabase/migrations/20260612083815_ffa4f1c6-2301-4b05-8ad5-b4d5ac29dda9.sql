
CREATE OR REPLACE FUNCTION public._cleanup_post_internal_links(input_content text)
RETURNS text
LANGUAGE plpgsql
AS $func$
DECLARE
  result text := input_content;
  m text[];
  slug_val text;
  anchor_html text;
  plain_anchor text;
  target_title text;
  match_count int;
  word text;
  escaped_slug text;
  escaped_anchor text;
  pattern text;
BEGIN
  IF input_content IS NULL OR position('href="/blink/' in input_content) = 0 THEN
    RETURN input_content;
  END IF;

  FOR m IN
    SELECT regexp_matches(
      input_content,
      '<a\s+[^>]*href="/blink/([^"]+)"[^>]*>([\s\S]*?)</a>',
      'g'
    )
  LOOP
    slug_val := m[1];
    anchor_html := m[2];
    plain_anchor := lower(regexp_replace(anchor_html, '<[^>]+>', '', 'g'));

    SELECT title INTO target_title FROM posts WHERE slug = slug_val LIMIT 1;

    match_count := 0;
    IF target_title IS NOT NULL THEN
      FOR word IN
        SELECT (regexp_matches(plain_anchor, '[a-z0-9ąćęłńóśźż]{4,}', 'g'))[1]
      LOOP
        IF position(word in lower(target_title)) > 0 THEN
          match_count := match_count + 1;
        END IF;
      END LOOP;
    END IF;

    IF target_title IS NULL OR match_count < 1 THEN
      escaped_slug := regexp_replace(slug_val, '([.\\+*?()\[\]{}|^$])', '\\\1', 'g');
      escaped_anchor := regexp_replace(anchor_html, '([.\\+*?()\[\]{}|^$])', '\\\1', 'g');
      pattern := '<a\s+[^>]*href="/blink/' || escaped_slug || '"[^>]*>' || escaped_anchor || '</a>';
      result := regexp_replace(result, pattern, anchor_html, 'g');
    END IF;
  END LOOP;

  result := regexp_replace(result, '<ul>\s*</ul>', '', 'g');
  result := regexp_replace(
    result,
    '<p>\s*<strong>\s*Przeczytaj również:?\s*</strong>\s*</p>(?!\s*<ul)',
    '',
    'g'
  );

  RETURN result;
END;
$func$;

UPDATE posts
SET content = public._cleanup_post_internal_links(content)
WHERE content LIKE '%href="/blink/%';

DROP FUNCTION public._cleanup_post_internal_links(text);
