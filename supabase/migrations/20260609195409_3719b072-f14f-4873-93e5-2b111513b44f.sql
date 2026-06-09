-- Insert tournament_mode key (default: off)
INSERT INTO public.settings (key, value)
VALUES ('tournament_mode', 'off')
ON CONFLICT (key) DO NOTHING;

-- Allow public read of tournament_mode (same pattern as site_patron)
DROP POLICY IF EXISTS "Public can read tournament_mode setting" ON public.settings;
CREATE POLICY "Public can read tournament_mode setting"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (key = 'tournament_mode');