
CREATE TABLE public.worldcup_cache (
  cache_key text PRIMARY KEY,
  data jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

GRANT SELECT ON public.worldcup_cache TO anon;
GRANT SELECT ON public.worldcup_cache TO authenticated;
GRANT ALL ON public.worldcup_cache TO service_role;

ALTER TABLE public.worldcup_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read worldcup cache"
ON public.worldcup_cache
FOR SELECT
USING (true);
