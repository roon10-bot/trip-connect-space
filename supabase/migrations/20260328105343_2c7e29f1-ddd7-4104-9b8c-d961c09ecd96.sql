
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write
CREATE POLICY "Admins can manage app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Edge functions (service role) can read
CREATE POLICY "Service role can read app settings"
  ON public.app_settings FOR SELECT
  TO service_role
  USING (true);

-- Seed the swish test mode setting
INSERT INTO public.app_settings (key, value) VALUES ('SWISH_TEST_MODE', 'false');
