-- Fix "permission denied for table users" by using auth.jwt() instead of querying auth.users

-- Drop and recreate the function that references auth.users indirectly via policies
DROP POLICY IF EXISTS "Travelers can view bookings they are part of" ON public.trip_bookings;
DROP POLICY IF EXISTS "Travelers can view their own traveler records" ON public.trip_booking_travelers;

-- Recreate policies using auth.jwt() ->> 'email' instead of querying auth.users
CREATE POLICY "Travelers can view bookings they are part of"
ON public.trip_bookings FOR SELECT
USING (
  public.is_traveler_on_booking(id, (auth.jwt() ->> 'email')::text)
);

CREATE POLICY "Travelers can view their own traveler records"
ON public.trip_booking_travelers FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')::text
);

-- Also fix the payments traveler policy which has the same issue
DROP POLICY IF EXISTS "Travelers can view payments for their bookings" ON public.payments;
CREATE POLICY "Travelers can view payments for their bookings"
ON public.payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_booking_travelers t
    WHERE t.trip_booking_id = payments.trip_booking_id
    AND t.email = (auth.jwt() ->> 'email')::text
  )
);

-- Fix the traveler INSERT policy on payments too
DROP POLICY IF EXISTS "Travelers can insert payments for their bookings" ON public.payments;
CREATE POLICY "Travelers can insert payments for their bookings"
ON public.payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trip_booking_travelers t
    WHERE t.trip_booking_id = payments.trip_booking_id
    AND t.email = (auth.jwt() ->> 'email')::text
  ) AND auth.uid() = user_id
);