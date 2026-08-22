CREATE TABLE public.review_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  normalized_title text NOT NULL UNIQUE,
  votes integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible review requests"
ON public.review_requests FOR SELECT
TO anon, authenticated
USING (is_visible = true);

CREATE POLICY "Admins and editors can view all review requests"
ON public.review_requests FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can insert review requests"
ON public.review_requests FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update review requests"
ON public.review_requests FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can delete review requests"
ON public.review_requests FOR DELETE
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_review_requests_updated_at
BEFORE UPDATE ON public.review_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.normalize_review_request_title(_title text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(regexp_replace(
    regexp_replace(
      lower(translate(_title, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')),
      '[^a-z0-9 ]', ' ', 'g'
    ),
    '\s+', ' ', 'g'
  ));
$$;

CREATE OR REPLACE FUNCTION public.vote_review_request(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.review_requests
  SET votes = votes + 1, updated_at = now()
  WHERE id = _id AND is_visible = true;
$$;

GRANT EXECUTE ON FUNCTION public.vote_review_request(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_review_request(_title text)
RETURNS TABLE (id uuid, title text, votes integer, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
  clean text;
  existing public.review_requests;
BEGIN
  clean := trim(_title);
  IF clean IS NULL OR length(clean) < 3 THEN
    RAISE EXCEPTION 'Title too short';
  END IF;
  IF length(clean) > 120 THEN
    clean := substring(clean from 1 for 120);
  END IF;

  norm := public.normalize_review_request_title(clean);

  SELECT * INTO existing FROM public.review_requests r WHERE r.normalized_title = norm;

  IF existing.id IS NOT NULL THEN
    UPDATE public.review_requests r
    SET votes = r.votes + 1, updated_at = now()
    WHERE r.id = existing.id
    RETURNING r.id, r.title, r.votes, false INTO id, title, votes, is_new;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.review_requests (title, normalized_title, votes)
  VALUES (clean, norm, 1)
  RETURNING review_requests.id, review_requests.title, review_requests.votes, true
  INTO id, title, votes, is_new;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review_request(text) TO anon, authenticated;