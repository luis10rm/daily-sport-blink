
-- Extend banner_position enum
ALTER TYPE banner_position ADD VALUE IF NOT EXISTS 'recki_home_top';
ALTER TYPE banner_position ADD VALUE IF NOT EXISTS 'recki_home_middle';
ALTER TYPE banner_position ADD VALUE IF NOT EXISTS 'recki_home_bottom';
ALTER TYPE banner_position ADD VALUE IF NOT EXISTS 'recki_inline';

-- Review categories
CREATE TABLE public.review_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon_url text,
  color text DEFAULT '#A855F7',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_categories TO authenticated;
GRANT ALL ON public.review_categories TO service_role;

ALTER TABLE public.review_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review categories" ON public.review_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins/editors can insert review categories" ON public.review_categories
  FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins/editors can update review categories" ON public.review_categories
  FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins/editors can delete review categories" ON public.review_categories
  FOR DELETE USING (is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_review_categories_updated_at
  BEFORE UPDATE ON public.review_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  verdict text,
  score numeric(3,1) CHECK (score IS NULL OR (score >= 0 AND score <= 10)),
  pros text[] NOT NULL DEFAULT '{}',
  cons text[] NOT NULL DEFAULT '{}',
  gallery text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  product_name text,
  product_brand text,
  category_id uuid REFERENCES public.review_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  source_url text,
  is_ai_generated boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reviews_category_id_idx ON public.reviews(category_id);
CREATE INDEX reviews_status_published_at_idx ON public.reviews(status, published_at DESC);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.reviews
  FOR SELECT USING (
    status = 'published' AND published_at IS NOT NULL AND published_at <= now()
  );
CREATE POLICY "Admins/editors can view all reviews" ON public.reviews
  FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins/editors can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins/editors can update reviews" ON public.reviews
  FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins/editors can delete reviews" ON public.reviews
  FOR DELETE USING (is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial review categories
INSERT INTO public.review_categories (name, slug, sort_order) VALUES
  ('Smartfony', 'smartfony', 1),
  ('Audio', 'audio', 2),
  ('Laptopy', 'laptopy', 3),
  ('Gaming', 'gaming', 4),
  ('Smart Home', 'smart-home', 5),
  ('Akcesoria', 'akcesoria', 6);
