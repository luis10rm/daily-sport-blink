-- Drop the blocking policy and create a proper one for public authors
DROP POLICY IF EXISTS "No direct public access to authors table" ON public.authors;

-- Allow anonymous users to view public author profiles
CREATE POLICY "Anyone can view public authors"
ON public.authors
FOR SELECT
TO anon
USING (is_public = true);

-- Also allow authenticated users to view public authors (in addition to their own)
DROP POLICY IF EXISTS "Authenticated users see own or admin access" ON public.authors;

CREATE POLICY "Authenticated users can view public or own authors"
ON public.authors
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR linked_user_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);