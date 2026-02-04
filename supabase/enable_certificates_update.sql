-- Enable RLS on the table (if not already enabled)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to update their own certificates
CREATE POLICY "Users can update their own certificates"
ON certificates
FOR UPDATE
USING (auth.uid() = user_id);
