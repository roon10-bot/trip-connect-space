
-- Allow travelers to insert payments for bookings they are part of
CREATE POLICY "Travelers can insert payments for their bookings"
ON public.payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_booking_travelers t
    WHERE t.trip_booking_id = payments.trip_booking_id
    AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  AND auth.uid() = user_id
);
