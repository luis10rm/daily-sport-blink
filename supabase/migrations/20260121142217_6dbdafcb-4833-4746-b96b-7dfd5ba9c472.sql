-- Create enum for banner positions
CREATE TYPE public.banner_position AS ENUM ('home_top', 'home_middle', 'home_bottom');

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cta_text TEXT NOT NULL,
  click_tag TEXT NOT NULL,
  impression_tag TEXT,
  image_desktop_url TEXT NOT NULL,
  image_mobile_url TEXT NOT NULL,
  position banner_position NOT NULL DEFAULT 'home_middle',
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active banners within date range
CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date >= now())
);

-- Admins and editors can view all banners
CREATE POLICY "Admins and editors can view all banners"
ON public.banners
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Admins and editors can insert banners
CREATE POLICY "Admins and editors can insert banners"
ON public.banners
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

-- Admins and editors can update banners
CREATE POLICY "Admins and editors can update banners"
ON public.banners
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

-- Admins and editors can delete banners
CREATE POLICY "Admins and editors can delete banners"
ON public.banners
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for banners bucket
CREATE POLICY "Banner images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins and editors can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners' AND is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banners' AND is_admin_or_editor(auth.uid()));