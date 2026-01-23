-- Add target_device column to banners table
-- Values: 'all' (both devices), 'desktop' (desktop only), 'mobile' (mobile only)
ALTER TABLE public.banners 
ADD COLUMN target_device text NOT NULL DEFAULT 'all';

-- Add check constraint for valid values
ALTER TABLE public.banners 
ADD CONSTRAINT banners_target_device_check 
CHECK (target_device IN ('all', 'desktop', 'mobile'));

-- Make image URLs nullable to support single-device banners
ALTER TABLE public.banners 
ALTER COLUMN image_desktop_url DROP NOT NULL;

ALTER TABLE public.banners 
ALTER COLUMN image_mobile_url DROP NOT NULL;

-- Create validation function for banner images based on target_device
CREATE OR REPLACE FUNCTION public.validate_banner_images()
RETURNS TRIGGER AS $$
BEGIN
  -- For desktop-only banners, require desktop image
  IF NEW.target_device = 'desktop' AND (NEW.image_desktop_url IS NULL OR NEW.image_desktop_url = '') THEN
    RAISE EXCEPTION 'Desktop banners require a desktop image';
  END IF;
  
  -- For mobile-only banners, require mobile image
  IF NEW.target_device = 'mobile' AND (NEW.image_mobile_url IS NULL OR NEW.image_mobile_url = '') THEN
    RAISE EXCEPTION 'Mobile banners require a mobile image';
  END IF;
  
  -- For all-device banners, require both images
  IF NEW.target_device = 'all' THEN
    IF (NEW.image_desktop_url IS NULL OR NEW.image_desktop_url = '') THEN
      RAISE EXCEPTION 'Banners for all devices require a desktop image';
    END IF;
    IF (NEW.image_mobile_url IS NULL OR NEW.image_mobile_url = '') THEN
      RAISE EXCEPTION 'Banners for all devices require a mobile image';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
CREATE TRIGGER validate_banner_images_trigger
BEFORE INSERT OR UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.validate_banner_images();