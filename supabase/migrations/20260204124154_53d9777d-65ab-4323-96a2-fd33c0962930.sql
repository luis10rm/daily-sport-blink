-- Add social_image_url column to sport_categories for Facebook Open Graph images
ALTER TABLE public.sport_categories
ADD COLUMN social_image_url text;