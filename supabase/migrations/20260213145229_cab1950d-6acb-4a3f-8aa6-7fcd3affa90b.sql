
-- Block anonymous access to traveler data
CREATE POLICY "Deny anonymous access to travelers"
ON public.trip_booking_travelers AS RESTRICTIVE
FOR SELECT TO anon USING (false);
