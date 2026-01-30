-- Create booking_flights table for flight information
CREATE TABLE public.booking_flights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  departure_city TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  airline TEXT,
  flight_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_accommodations table for accommodation information
CREATE TABLE public.booking_accommodations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  address TEXT,
  room_type TEXT,
  check_in_time TEXT DEFAULT '14:00',
  check_out_time TEXT DEFAULT '11:00',
  amenities TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking_attachments table for document uploads
CREATE TABLE public.booking_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.booking_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_flights
CREATE POLICY "Users can view their booking flights"
ON public.booking_flights
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_flights.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all booking flights"
ON public.booking_flights
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert booking flights"
ON public.booking_flights
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update booking flights"
ON public.booking_flights
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete booking flights"
ON public.booking_flights
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for booking_accommodations
CREATE POLICY "Users can view their booking accommodations"
ON public.booking_accommodations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_accommodations.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all booking accommodations"
ON public.booking_accommodations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert booking accommodations"
ON public.booking_accommodations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update booking accommodations"
ON public.booking_accommodations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete booking accommodations"
ON public.booking_accommodations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for booking_attachments
CREATE POLICY "Users can view their booking attachments"
ON public.booking_attachments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_attachments.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all booking attachments"
ON public.booking_attachments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert booking attachments"
ON public.booking_attachments
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete booking attachments"
ON public.booking_attachments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for booking attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('booking-attachments', 'booking-attachments', false);

-- Storage policies for booking attachments
CREATE POLICY "Admins can upload booking attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'booking-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can view their booking attachments in storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'booking-attachments'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.booking_attachments ba
      JOIN public.bookings b ON ba.booking_id = b.id
      WHERE ba.file_url LIKE '%' || storage.objects.name
      AND b.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can delete booking attachments from storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'booking-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Add triggers for updated_at
CREATE TRIGGER update_booking_flights_updated_at
BEFORE UPDATE ON public.booking_flights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_accommodations_updated_at
BEFORE UPDATE ON public.booking_accommodations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();