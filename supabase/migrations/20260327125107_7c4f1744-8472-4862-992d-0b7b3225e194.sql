
-- Add allowed_email to discount_codes for personal codes
ALTER TABLE public.discount_codes ADD COLUMN IF NOT EXISTS allowed_email text DEFAULT NULL;

-- Create table to track per-email usage of discount codes
CREATE TABLE public.discount_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  email text NOT NULL,
  trip_booking_id uuid REFERENCES public.trip_bookings(id) ON DELETE SET NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(discount_code_id, email)
);

ALTER TABLE public.discount_code_uses ENABLE ROW LEVEL SECURITY;

-- Admins can manage all usage records
CREATE POLICY "Admins can manage discount code uses"
ON public.discount_code_uses FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can check if a code has been used (needed for validation during booking)
CREATE POLICY "Anyone can view discount code uses"
ON public.discount_code_uses FOR SELECT
TO public
USING (true);
