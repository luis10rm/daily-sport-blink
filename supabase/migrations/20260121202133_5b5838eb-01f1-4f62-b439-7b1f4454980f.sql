-- Fix 1: Make banners bucket private (SELECT policy still allows public read)
UPDATE storage.buckets SET public = false WHERE id = 'banners';

-- Fix 2: Add database constraints for input validation on posts table
ALTER TABLE public.posts 
ADD CONSTRAINT posts_title_length CHECK (length(title) BETWEEN 5 AND 200),
ADD CONSTRAINT posts_excerpt_length CHECK (length(excerpt) BETWEEN 10 AND 500),
ADD CONSTRAINT posts_valid_source_url CHECK (source_url ~ '^https?://');

-- Fix 3: Add database constraints for input validation on banners table
ALTER TABLE public.banners 
ADD CONSTRAINT banners_title_length CHECK (length(title) BETWEEN 3 AND 100),
ADD CONSTRAINT banners_valid_click_tag CHECK (click_tag ~ '^https?://');