ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS is_community_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_request_id uuid NULL REFERENCES public.review_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reviews_review_request_id_idx ON public.reviews (review_request_id);