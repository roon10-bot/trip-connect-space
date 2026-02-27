
ALTER TABLE public.trips
  ADD COLUMN base_price_accommodation numeric NOT NULL DEFAULT 0,
  ADD COLUMN base_price_flight numeric NOT NULL DEFAULT 0,
  ADD COLUMN base_price_extras numeric NOT NULL DEFAULT 0;
