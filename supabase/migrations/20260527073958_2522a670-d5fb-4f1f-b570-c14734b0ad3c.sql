
-- 1. Authors: harden self-update policy with WITH CHECK to prevent privilege escalation
DROP POLICY IF EXISTS "Users can update their linked profile" ON public.authors;

CREATE POLICY "Users can update their linked profile"
ON public.authors
FOR UPDATE
TO authenticated
USING (linked_user_id = auth.uid())
WITH CHECK (
  linked_user_id = auth.uid()
  AND is_public = (SELECT a.is_public FROM public.authors a WHERE a.id = authors.id)
  AND role_title IS NOT DISTINCT FROM (SELECT a.role_title FROM public.authors a WHERE a.id = authors.id)
);

-- 2. Social posts: restrict webhook_response column to admins/service_role only
REVOKE SELECT ON public.social_posts FROM authenticated;
GRANT SELECT (id, post_id, platform, status, caption, scheduled_at, published_at, created_at, created_by)
  ON public.social_posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
