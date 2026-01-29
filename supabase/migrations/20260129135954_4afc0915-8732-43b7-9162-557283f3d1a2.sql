-- Create a separate secure table for author emails
CREATE TABLE public.author_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(author_id)
);

-- Enable RLS
ALTER TABLE public.author_emails ENABLE ROW LEVEL SECURITY;

-- Strict policy: Only the author themselves can view their email
CREATE POLICY "Authors can view their own email"
ON public.author_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.authors 
    WHERE authors.id = author_emails.author_id 
    AND authors.linked_user_id = auth.uid()
  )
);

-- Admins can view all emails
CREATE POLICY "Admins can view all emails"
ON public.author_emails
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert emails
CREATE POLICY "Admins can insert emails"
ON public.author_emails
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update emails
CREATE POLICY "Admins can update emails"
ON public.author_emails
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete emails
CREATE POLICY "Admins can delete emails"
ON public.author_emails
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data from authors.linked_email to author_emails
INSERT INTO public.author_emails (author_id, email)
SELECT id, linked_email 
FROM public.authors 
WHERE linked_email IS NOT NULL AND linked_email != '';

-- Drop the linked_email column from authors table
ALTER TABLE public.authors DROP COLUMN linked_email;

-- Recreate the authors_public view without linked_email (it was already excluded, but let's be explicit)
DROP VIEW IF EXISTS public.authors_public;
CREATE VIEW public.authors_public
WITH (security_invoker=on) AS
SELECT 
  id,
  display_name,
  slug,
  avatar_url,
  bio,
  role_title,
  is_public,
  social_twitter,
  social_instagram,
  cover_image_url,
  created_at,
  updated_at
FROM public.authors
WHERE is_public = true;

-- Add trigger for updated_at on author_emails
CREATE TRIGGER update_author_emails_updated_at
BEFORE UPDATE ON public.author_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();