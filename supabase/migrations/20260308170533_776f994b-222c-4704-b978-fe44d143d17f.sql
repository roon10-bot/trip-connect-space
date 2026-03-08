
ALTER TABLE public.partner_listings
ADD COLUMN IF NOT EXISTS property_type text,
ADD COLUMN IF NOT EXISTS access_type text,
ADD COLUMN IF NOT EXISTS beds integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS bathrooms integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_price numeric DEFAULT 0;
