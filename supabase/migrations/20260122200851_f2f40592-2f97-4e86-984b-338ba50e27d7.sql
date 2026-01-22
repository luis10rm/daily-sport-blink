-- Create settings table for storing configurable values like master prompts
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings"
ON public.settings FOR SELECT
USING (true);

-- Only admins and editors can update settings
CREATE POLICY "Admins can update settings"
ON public.settings FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

-- Only admins can insert new settings
CREATE POLICY "Admins can insert settings"
ON public.settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete settings
CREATE POLICY "Admins can delete settings"
ON public.settings FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert default master prompt for article extraction
INSERT INTO public.settings (key, value) VALUES (
  'article_extraction_prompt',
  'Jesteś asystentem redakcji sportowej Daily Sport. Na podstawie podanego artykułu wygeneruj dane do publikacji.

ZASADY:
1. Tytuł: max 80 znaków, chwytliwy, po polsku, bez clickbaitu
2. Excerpt: max 200 znaków, zachęcający do kliknięcia, streszczający główną myśl
3. Kategoria: wybierz JEDNĄ z: football, basketball, tennis, f1, mma, other
4. Tagi: 3-5 krótkich słów kluczowych (bez #), po polsku

Odpowiedz w formacie JSON zgodnym ze schematem.'
);