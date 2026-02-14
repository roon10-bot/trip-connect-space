
-- Create table for documents/attachments linked to trip bookings
CREATE TABLE public.trip_booking_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_booking_documents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view all trip booking documents"
ON public.trip_booking_documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert trip booking documents"
ON public.trip_booking_documents FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete trip booking documents"
ON public.trip_booking_documents FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Booking owners can view documents
CREATE POLICY "Users can view documents for their bookings"
ON public.trip_booking_documents FOR SELECT
USING (is_booking_owner(trip_booking_id, auth.uid()));

-- Travelers can view documents for bookings they're part of
CREATE POLICY "Travelers can view documents for their bookings"
ON public.trip_booking_documents FOR SELECT
USING (is_traveler_on_booking(trip_booking_id, (auth.jwt() ->> 'email'::text)));
