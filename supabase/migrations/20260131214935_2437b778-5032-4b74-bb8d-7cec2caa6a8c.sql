-- Add min/max persons and base price for accommodation-based pricing
ALTER TABLE public.trips
ADD COLUMN min_persons integer DEFAULT 1,
ADD COLUMN max_persons integer DEFAULT 10,
ADD COLUMN base_price numeric DEFAULT 0;

-- Add comment explaining the columns
COMMENT ON COLUMN public.trips.min_persons IS 'Minimum antal personer för boendet';
COMMENT ON COLUMN public.trips.max_persons IS 'Maximum antal personer för boendet';
COMMENT ON COLUMN public.trips.base_price IS 'Baspris för boendet (t.ex. lägenhetshyra) innan marginal';