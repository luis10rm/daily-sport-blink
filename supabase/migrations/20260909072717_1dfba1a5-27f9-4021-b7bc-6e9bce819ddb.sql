CREATE TABLE public.ad_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_type text NOT NULL,
  ad_id text,
  variant text,
  target_url text,
  path text,
  device text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.ad_clicks TO anon;
GRANT SELECT, INSERT ON public.ad_clicks TO authenticated;
GRANT ALL ON public.ad_clicks TO service_role;

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an ad click"
  ON public.ad_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read ad clicks"
  ON public.ad_clicks FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE INDEX idx_ad_clicks_created_at ON public.ad_clicks (created_at DESC);
CREATE INDEX idx_ad_clicks_type_created ON public.ad_clicks (ad_type, created_at DESC);