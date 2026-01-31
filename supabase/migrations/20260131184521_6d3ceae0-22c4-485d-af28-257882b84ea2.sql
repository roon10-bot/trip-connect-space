-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;

-- Create a proper policy that allows users to insert their own payments
-- (Edge functions will use service role which bypasses RLS)
CREATE POLICY "Users can insert their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);