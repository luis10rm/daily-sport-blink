-- Fix: Restrict posts access to only published content
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;

CREATE POLICY "Anyone can view published posts"
ON public.posts
FOR SELECT
USING (published_at <= now());