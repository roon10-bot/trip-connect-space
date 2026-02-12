
-- Create table for individual traveler details per booking
CREATE TABLE public.trip_booking_travelers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  traveler_index INTEGER NOT NULL DEFAULT 0,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT NOT NULL,
  departure_location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_booking_travelers ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can view all trip booking travelers"
ON public.trip_booking_travelers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert trip booking travelers"
ON public.trip_booking_travelers FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update trip booking travelers"
ON public.trip_booking_travelers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete trip booking travelers"
ON public.trip_booking_travelers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (same as trip_bookings)
CREATE POLICY "Anyone can create trip booking travelers"
ON public.trip_booking_travelers FOR INSERT
WITH CHECK (true);

-- Users can view their own travelers via trip_bookings
CREATE POLICY "Users can view their own trip booking travelers"
ON public.trip_booking_travelers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.trip_bookings
  WHERE trip_bookings.id = trip_booking_travelers.trip_booking_id
  AND trip_bookings.user_id = auth.uid()
));
