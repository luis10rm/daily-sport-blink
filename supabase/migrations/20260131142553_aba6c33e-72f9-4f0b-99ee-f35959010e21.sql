-- Allow public access to site_patron setting only
CREATE POLICY "Public can read site_patron setting"
  ON public.settings
  FOR SELECT
  TO public
  USING (key = 'site_patron');