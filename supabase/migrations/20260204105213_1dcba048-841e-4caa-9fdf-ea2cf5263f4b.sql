-- Create social_posts table for tracking social media publications
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'facebook',
  status text NOT NULL DEFAULT 'pending',
  caption text,
  scheduled_at timestamptz,
  published_at timestamptz,
  webhook_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Add constraint for valid status values
ALTER TABLE public.social_posts 
ADD CONSTRAINT social_posts_status_check 
CHECK (status IN ('pending', 'published', 'failed'));

-- Add constraint for valid platform values
ALTER TABLE public.social_posts 
ADD CONSTRAINT social_posts_platform_check 
CHECK (platform IN ('facebook', 'twitter', 'instagram'));

-- Create index for faster lookups
CREATE INDEX idx_social_posts_post_id ON public.social_posts(post_id);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins and editors can view social posts"
ON public.social_posts
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can insert social posts"
ON public.social_posts
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update social posts"
ON public.social_posts
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can delete social posts"
ON public.social_posts
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Insert default setting for Make webhook URL (empty by default)
INSERT INTO public.settings (key, value)
VALUES ('make_webhook_url', '')
ON CONFLICT (key) DO NOTHING;