-- Insert default site_patron configuration (disabled by default)
INSERT INTO public.settings (key, value)
VALUES (
  'site_patron',
  '{"enabled":false,"prefix_text":"Głównym patronem serwisu jest","patron_name":"","patron_logo_url":"","cta_text":"","cta_url":"","background_color":"#1e3a5f","text_color":"#ffffff","style":"solid","dismissible":true}'
)
ON CONFLICT (key) DO NOTHING;