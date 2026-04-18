-- News sources table
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  list_selector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scanned_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can view sources" ON public.news_sources
  FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins and editors can insert sources" ON public.news_sources
  FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins and editors can update sources" ON public.news_sources
  FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete sources" ON public.news_sources
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_news_sources_updated_at
  BEFORE UPDATE ON public.news_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- News suggestions table
CREATE TABLE public.news_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.news_sources(id) ON DELETE SET NULL,
  article_url TEXT NOT NULL UNIQUE,
  title TEXT,
  excerpt TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  ai_score INTEGER,
  ai_reasoning TEXT,
  suggested_category_id UUID REFERENCES public.sport_categories(id) ON DELETE SET NULL,
  suggested_tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_suggestions_status ON public.news_suggestions(status);
CREATE INDEX idx_news_suggestions_score ON public.news_suggestions(ai_score DESC);
CREATE INDEX idx_news_suggestions_discovered ON public.news_suggestions(discovered_at DESC);

ALTER TABLE public.news_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can view suggestions" ON public.news_suggestions
  FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins and editors can insert suggestions" ON public.news_suggestions
  FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins and editors can update suggestions" ON public.news_suggestions
  FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete suggestions" ON public.news_suggestions
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
-- Service role (edge function) bypass via service key — no extra policy needed.

CREATE TRIGGER update_news_suggestions_updated_at
  BEFORE UPDATE ON public.news_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron + pg_net for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;