-- Fix 1: Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);

-- Fix 2: Remove email column from profiles table to prevent exposure
-- Email is already securely stored in auth.users table

-- First, update the trigger function to not copy email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Then remove the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;