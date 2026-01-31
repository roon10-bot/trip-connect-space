-- Create trip_bookings table
CREATE TABLE public.trip_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Traveler information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT NOT NULL,
  departure_location TEXT NOT NULL,
  
  -- Booking details
  travelers INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  discount_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all trip bookings"
ON public.trip_bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update trip bookings"
ON public.trip_bookings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete trip bookings"
ON public.trip_bookings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own trip bookings"
ON public.trip_bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create trip bookings"
ON public.trip_bookings FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_trip_bookings_updated_at
BEFORE UPDATE ON public.trip_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();