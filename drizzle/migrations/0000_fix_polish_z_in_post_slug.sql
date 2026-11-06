CREATE OR REPLACE FUNCTION public.generate_post_slug(title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT trim(both '-' from lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          translate(title, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ'),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      ),
      '-{2,}', '-', 'g'
    )
  ));
$$;