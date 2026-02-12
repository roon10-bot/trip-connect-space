
-- Allow travelers to view trip bookings they are part of (via trip_booking_travelers)
CREATE POLICY "Travelers can view bookings they are part of"
ON public.trip_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_booking_travelers t
    WHERE t.trip_booking_id = trip_bookings.id
    AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow travelers to view their own traveler records
CREATE POLICY "Travelers can view their own traveler records"
ON public.trip_booking_travelers
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow travelers to view payments for bookings they are part of
CREATE POLICY "Travelers can view payments for their bookings"
ON public.payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_booking_travelers t
    WHERE t.trip_booking_id = payments.trip_booking_id
    AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
