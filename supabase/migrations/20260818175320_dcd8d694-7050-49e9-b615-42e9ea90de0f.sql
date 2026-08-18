GRANT SELECT ON public.post_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_redirects TO authenticated;
GRANT ALL ON public.post_redirects TO service_role;