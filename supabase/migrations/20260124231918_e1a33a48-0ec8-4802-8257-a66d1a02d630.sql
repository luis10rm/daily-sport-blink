-- Remove duplicate foreign key constraint to resolve PGRST201 error
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_category_id_fkey;