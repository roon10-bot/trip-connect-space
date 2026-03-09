
CREATE TABLE public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type text NOT NULL,
  key_value text NOT NULL,
  endpoint text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for rate limit queries
CREATE INDEX idx_rate_limit_log_lookup ON public.rate_limit_log (key_type, key_value, endpoint, created_at);

-- Auto-cleanup: delete entries older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limit_log WHERE created_at < now() - interval '24 hours';
$$;

-- DB function to check rate limit and log the attempt
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key_type text,
  p_key_value text,
  p_endpoint text,
  p_window_minutes integer,
  p_max_requests integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests in window
  SELECT count(*) INTO request_count
  FROM public.rate_limit_log
  WHERE key_type = p_key_type
    AND key_value = p_key_value
    AND endpoint = p_endpoint
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  IF request_count >= p_max_requests THEN
    -- Log blocked attempt
    INSERT INTO public.rate_limit_log (key_type, key_value, endpoint, blocked)
    VALUES (p_key_type, p_key_value, p_endpoint, true);
    RETURN true; -- is rate limited
  END IF;

  -- Log successful attempt
  INSERT INTO public.rate_limit_log (key_type, key_value, endpoint, blocked)
  VALUES (p_key_type, p_key_value, p_endpoint, false);
  RETURN false; -- not rate limited
END;
$$;

-- RLS: no direct access, only via security definer functions
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
