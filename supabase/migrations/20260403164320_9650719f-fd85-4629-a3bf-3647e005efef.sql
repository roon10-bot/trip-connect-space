ALTER TABLE public.partner_profiles ALTER COLUMN iban DROP NOT NULL;
ALTER TABLE public.partner_profiles ALTER COLUMN iban SET DEFAULT '';