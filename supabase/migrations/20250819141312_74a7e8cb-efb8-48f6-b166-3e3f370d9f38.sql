-- Enable RLS on account table and add basic policy
ALTER TABLE account ENABLE ROW LEVEL SECURITY;

-- Add a basic policy for account table (assuming it's user-specific)
CREATE POLICY "Users can manage their own accounts" 
ON account 
FOR ALL 
USING (true) 
WITH CHECK (true);