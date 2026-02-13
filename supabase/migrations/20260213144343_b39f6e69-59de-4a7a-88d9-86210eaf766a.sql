
-- Drop public INSERT policy on meeting_bookings (now handled by edge function with service_role)
DROP POLICY IF EXISTS "Anyone can create meeting bookings" ON public.meeting_bookings;

-- Drop public INSERT policy on trip_bookings (will be handled by new edge function)
DROP POLICY IF EXISTS "Anyone can create trip bookings" ON public.trip_bookings;

-- Drop public INSERT policy on trip_booking_travelers (will be handled by new edge function)
DROP POLICY IF EXISTS "Anyone can create trip booking travelers" ON public.trip_booking_travelers;
