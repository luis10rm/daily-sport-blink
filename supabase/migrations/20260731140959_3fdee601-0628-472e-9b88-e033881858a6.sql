ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_topic_of_day boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_single_topic_of_day
  ON public.reviews ((is_topic_of_day))
  WHERE is_topic_of_day = true;