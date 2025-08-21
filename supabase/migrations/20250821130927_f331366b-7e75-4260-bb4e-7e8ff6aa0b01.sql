-- Fix security vulnerability in account table
-- Add user_id column to link accounts to specific users
ALTER TABLE public.account ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL for new records (existing records can remain NULL temporarily)
ALTER TABLE public.account ALTER COLUMN user_id SET NOT NULL;

-- Drop the overly permissive policy
DROP POLICY "Users can manage their own accounts" ON public.account;

-- Create secure policies that restrict access to user's own account data
CREATE POLICY "Users can view their own account"
  ON public.account 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own account"
  ON public.account 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own account"
  ON public.account 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own account"
  ON public.account 
  FOR DELETE 
  USING (auth.uid() = user_id);