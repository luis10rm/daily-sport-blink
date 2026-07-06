-- Extend posts with hide + canonical pointer
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS redirect_to_post_id uuid NULL REFERENCES public.posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_visible_published_at
  ON public.posts (published_at DESC)
  WHERE is_hidden = false;

-- Redirect log & source of truth for the Cloudflare Worker
CREATE TABLE IF NOT EXISTS public.post_redirects (
  from_slug   text PRIMARY KEY,
  to_slug     text NOT NULL,
  from_url    text NOT NULL,
  to_url      text NOT NULL,
  reason      text NOT NULL DEFAULT 'duplicate',
  created_by  uuid NULL,
  hits        integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_redirects_no_self CHECK (from_slug <> to_slug)
);

CREATE INDEX IF NOT EXISTS idx_post_redirects_to_slug ON public.post_redirects (to_slug);

GRANT SELECT ON public.post_redirects TO anon;
GRANT SELECT ON public.post_redirects TO authenticated;
GRANT ALL ON public.post_redirects TO service_role;

ALTER TABLE public.post_redirects ENABLE ROW LEVEL SECURITY;

-- Public read (Worker uses anon key)
CREATE POLICY "post_redirects_public_read"
  ON public.post_redirects
  FOR SELECT
  USING (true);

-- Only editors/admins may write
CREATE POLICY "post_redirects_admin_editor_insert"
  ON public.post_redirects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "post_redirects_admin_editor_update"
  ON public.post_redirects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "post_redirects_admin_editor_delete"
  ON public.post_redirects
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- Reuse the shared updated_at trigger
DROP TRIGGER IF EXISTS trigger_post_redirects_updated_at ON public.post_redirects;
CREATE TRIGGER trigger_post_redirects_updated_at
BEFORE UPDATE ON public.post_redirects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();