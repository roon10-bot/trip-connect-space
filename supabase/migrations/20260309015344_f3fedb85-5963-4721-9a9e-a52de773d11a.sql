
-- Ensure RLS is enabled on rate_limit_log (it currently has no policies, meaning open access)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- rate_limit_log is only used by edge functions via service role key,
-- so no permissive policies needed. Default-deny blocks all client access.
