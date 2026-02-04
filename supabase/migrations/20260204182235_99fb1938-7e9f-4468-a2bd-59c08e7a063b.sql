-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (anonymous submissions allowed)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Only admins and editors can view feedback
CREATE POLICY "Admins and editors can view feedback"
ON public.feedback
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Only admins and editors can update feedback (mark as read)
CREATE POLICY "Admins and editors can update feedback"
ON public.feedback
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

-- Only admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
USING (has_role(auth.uid(), 'admin'));