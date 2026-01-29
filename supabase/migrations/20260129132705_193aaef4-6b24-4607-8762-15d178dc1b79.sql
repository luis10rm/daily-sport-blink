-- Create a public view that excludes sensitive fields (linked_email, linked_user_id)
CREATE VIEW public.authors_public
WITH (security_invoker = on) AS
SELECT 
  id,
  display_name,
  slug,
  avatar_url,
  cover_image_url,
  bio,
  role_title,
  social_twitter,
  social_instagram,
  is_public,
  created_at,
  updated_at
FROM public.authors
WHERE is_public = true;

-- Grant access to the view for all users
GRANT SELECT ON public.authors_public TO anon;
GRANT SELECT ON public.authors_public TO authenticated;

-- Drop the old public access policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view public authors" ON public.authors;

-- Create a new restrictive policy - public users cannot directly access the authors table
-- They must use the authors_public view instead
CREATE POLICY "No direct public access to authors table"
ON public.authors
FOR SELECT
TO anon
USING (false);

-- Authenticated users can only see their own linked profile or if they're admin
CREATE POLICY "Authenticated users see own or admin access"
ON public.authors
FOR SELECT
TO authenticated
USING (
  linked_user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);