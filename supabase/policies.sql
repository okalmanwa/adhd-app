-- Enable RLS on rewards table
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own rewards
CREATE POLICY "Users can read their own rewards"
ON rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own rewards
CREATE POLICY "Users can insert their own rewards"
ON rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own rewards
CREATE POLICY "Users can update their own rewards"
ON rewards
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own rewards
CREATE POLICY "Users can delete their own rewards"
ON rewards
FOR DELETE
USING (auth.uid() = user_id); 