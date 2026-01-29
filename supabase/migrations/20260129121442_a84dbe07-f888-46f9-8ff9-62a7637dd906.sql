-- Fix: Remove public read access to settings table
-- Settings contain sensitive AI prompts and system configuration

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;

-- Create new restrictive policy - only admins and editors can read settings
CREATE POLICY "Admins and editors can read settings" 
ON public.settings 
FOR SELECT 
USING (is_admin_or_editor(auth.uid()));