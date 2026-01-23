-- Create sport_categories table to replace enum
CREATE TABLE public.sport_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon_name text, -- Lucide icon name (e.g., "dribbble", "trophy")
  icon_url text, -- Custom uploaded icon URL
  bg_color text NOT NULL DEFAULT '#6366f1', -- HSL or hex color for background
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false, -- Mark "other" as default fallback
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add constraint: either icon_name or icon_url must be set
ALTER TABLE public.sport_categories
ADD CONSTRAINT sport_categories_icon_check 
CHECK (icon_name IS NOT NULL OR icon_url IS NOT NULL);

-- Enable RLS
ALTER TABLE public.sport_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view sport categories"
ON public.sport_categories
FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert sport categories"
ON public.sport_categories
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sport categories"
ON public.sport_categories
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sport categories"
ON public.sport_categories
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_sport_categories_updated_at
BEFORE UPDATE ON public.sport_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories based on existing enum
INSERT INTO public.sport_categories (slug, name, icon_name, bg_color, sort_order, is_default) VALUES
  ('football', 'Piłka nożna', 'dribbble', '142 76% 36%', 1, false),
  ('basketball', 'Koszykówka', 'dribbble', '24 95% 53%', 2, false),
  ('tennis', 'Tenis', 'circle-dot', '64 85% 43%', 3, false),
  ('f1', 'F1', 'bike', '0 84% 60%', 4, false),
  ('mma', 'MMA', 'swords', '280 75% 55%', 5, false),
  ('other', 'Inne', 'trophy', '220 14% 46%', 100, true);

-- Add category_id column to posts table (nullable first for migration)
ALTER TABLE public.posts
ADD COLUMN category_id uuid REFERENCES public.sport_categories(id);

-- Migrate existing posts to use category_id
UPDATE public.posts p
SET category_id = sc.id
FROM public.sport_categories sc
WHERE p.category::text = sc.slug;

-- Create storage bucket for category icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-icons', 'category-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for category icons
CREATE POLICY "Anyone can view category icons"
ON storage.objects
FOR SELECT
USING (bucket_id = 'category-icons');

CREATE POLICY "Admins can upload category icons"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update category icons"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete category icons"
ON storage.objects
FOR DELETE
USING (bucket_id = 'category-icons' AND has_role(auth.uid(), 'admin'::app_role));