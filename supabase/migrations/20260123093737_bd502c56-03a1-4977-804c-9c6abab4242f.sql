-- Fix the search_path for the validation function
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
$$ LANGUAGE plpgsql SET search_path = public;