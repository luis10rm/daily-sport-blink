ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS sections text[] NOT NULL DEFAULT ARRAY['sport']::text[];

UPDATE public.banners
  SET sections = ARRAY['sport','tech']::text[]
  WHERE show_on_tech = true;

UPDATE public.banners
  SET sections = ARRAY['tech']::text[]
  WHERE position::text LIKE 'recki_%' AND NOT ('tech' = ANY(sections));

CREATE INDEX IF NOT EXISTS banners_sections_gin_idx ON public.banners USING gin (sections);