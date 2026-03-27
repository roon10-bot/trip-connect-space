ALTER TABLE public.trip_booking_travelers
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES public.discount_codes(id),
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;