ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'review';
ALTER TABLE public.reviews ADD CONSTRAINT reviews_content_type_check CHECK (content_type IN ('review','news'));
CREATE INDEX IF NOT EXISTS reviews_content_type_idx ON public.reviews(content_type);