-- Fix infinite recursion: trip_bookings SELECT policy references trip_booking_travelers,
-- and trip_booking_travelers SELECT policy references trip_bookings, causing a loop.

-- Drop the problematic circular policies
DROP POLICY IF EXISTS "Travelers can view bookings they are part of" ON public.trip_bookings;
DROP POLICY IF EXISTS "Users can view their own trip booking travelers" ON public.trip_booking_travelers;
DROP POLICY IF EXISTS "Travelers can view their own traveler records" ON public.trip_booking_travelers;

-- Recreate trip_bookings policy for travelers: use a direct email match without joining trip_booking_travelers
-- Instead, check if the user's email matches the booking's email (primary contact) 
-- OR check trip_booking_travelers directly but with SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_traveler_on_booking(booking_id uuid, user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_booking_travelers t
    WHERE t.trip_booking_id = booking_id
    AND t.email = user_email
  );
$$;

-- Recreate: travelers can view bookings they are part of (no recursion via SECURITY DEFINER function)
CREATE POLICY "Travelers can view bookings they are part of"
ON public.trip_bookings FOR SELECT
USING (
  public.is_traveler_on_booking(id, (SELECT email FROM auth.users WHERE id = auth.uid())::text)
);

-- Recreate: travelers can see their own traveler records (direct email match, no join to trip_bookings)
CREATE POLICY "Travelers can view their own traveler records"
ON public.trip_booking_travelers FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);

-- Recreate: booking owner can see all travelers on their booking (use SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_booking_owner(booking_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_bookings
    WHERE id = booking_id
    AND user_id = check_user_id
  );
$$;

CREATE POLICY "Users can view their own trip booking travelers"
ON public.trip_booking_travelers FOR SELECT
USING (
  public.is_booking_owner(trip_booking_id, auth.uid())
);