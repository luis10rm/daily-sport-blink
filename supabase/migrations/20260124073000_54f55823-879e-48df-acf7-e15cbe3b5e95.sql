-- Create wallpapers table for premium takeover campaigns
CREATE TABLE public.wallpapers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  background_image_url TEXT,
  left_wing_url TEXT,
  right_wing_url TEXT,
  background_color TEXT NOT NULL DEFAULT '#000000',
  click_url TEXT NOT NULL,
  linked_banner_id UUID REFERENCES public.banners(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  min_screen_width INTEGER NOT NULL DEFAULT 1280,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallpapers
CREATE POLICY "Anyone can view active wallpapers"
ON public.wallpapers
FOR SELECT
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date >= now())
);

CREATE POLICY "Admins can view all wallpapers"
ON public.wallpapers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert wallpapers"
ON public.wallpapers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wallpapers"
ON public.wallpapers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wallpapers"
ON public.wallpapers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wallpapers_updated_at
BEFORE UPDATE ON public.wallpapers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for wallpaper images
INSERT INTO storage.buckets (id, name, public) VALUES ('wallpapers', 'wallpapers', true);

-- Storage policies for wallpaper images
CREATE POLICY "Wallpaper images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'wallpapers');

CREATE POLICY "Admins can upload wallpaper images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wallpapers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update wallpaper images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'wallpapers' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete wallpaper images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'wallpapers' AND has_role(auth.uid(), 'admin'::app_role));