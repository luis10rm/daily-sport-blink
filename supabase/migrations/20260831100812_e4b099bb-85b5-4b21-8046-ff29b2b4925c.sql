ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS practical_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_captions jsonb NOT NULL DEFAULT '[]'::jsonb;