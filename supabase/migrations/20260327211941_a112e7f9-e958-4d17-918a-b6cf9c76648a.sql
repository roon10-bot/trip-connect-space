-- Allow null user_id in pending_trip_bookings for guest checkout
ALTER TABLE public.pending_trip_bookings ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous users to insert pending bookings (needed for guest checkout)
CREATE POLICY "Anyone can insert pending bookings"
ON public.pending_trip_bookings FOR INSERT
TO public
WITH CHECK (true);

-- Allow anonymous users to view pending bookings by id (for confirmation page polling)
CREATE POLICY "Anyone can view own pending bookings by id"
ON public.pending_trip_bookings FOR SELECT
TO public
USING (true);

-- Update create_trip_booking_atomic to accept null user_id
CREATE OR REPLACE FUNCTION public.create_trip_booking_atomic(
  p_trip_id uuid, p_user_id uuid DEFAULT NULL, p_first_name text DEFAULT '', p_last_name text DEFAULT '',
  p_email text DEFAULT '', p_birth_date date DEFAULT CURRENT_DATE, p_phone text DEFAULT '',
  p_departure_location text DEFAULT '', p_travelers integer DEFAULT 1, p_total_price numeric DEFAULT 0,
  p_discount_code text DEFAULT NULL, p_discount_amount numeric DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_capacity integer;
  v_is_fullbooked boolean;
  v_is_active boolean;
  v_current_travelers integer;
  v_booking_id uuid;
  v_spots_left integer;
BEGIN
  SELECT capacity, is_fullbooked, is_active
  INTO v_capacity, v_is_fullbooked, v_is_active
  FROM public.trips
  WHERE id = p_trip_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'TRIP_NOT_FOUND'; END IF;
  IF NOT v_is_active THEN RAISE EXCEPTION 'TRIP_NOT_ACTIVE'; END IF;
  IF v_is_fullbooked THEN RAISE EXCEPTION 'TRIP_FULLBOOKED'; END IF;

  SELECT COALESCE(SUM(travelers), 0) INTO v_current_travelers
  FROM public.trip_bookings
  WHERE trip_id = p_trip_id AND status IN ('pending', 'preliminary', 'confirmed');

  v_spots_left := v_capacity - v_current_travelers;

  IF p_travelers > v_spots_left THEN
    IF v_spots_left <= 0 THEN RAISE EXCEPTION 'TRIP_FULLBOOKED';
    ELSE RAISE EXCEPTION 'INSUFFICIENT_CAPACITY:%', v_spots_left;
    END IF;
  END IF;

  INSERT INTO public.trip_bookings (
    trip_id, user_id, first_name, last_name, email,
    birth_date, phone, departure_location, travelers,
    total_price, discount_code, discount_amount, status
  ) VALUES (
    p_trip_id, p_user_id, p_first_name, p_last_name, p_email,
    p_birth_date, p_phone, p_departure_location, p_travelers,
    p_total_price, p_discount_code, p_discount_amount, 'pending'
  )
  RETURNING id INTO v_booking_id;

  IF (v_current_travelers + p_travelers) >= v_capacity THEN
    UPDATE public.trips SET is_fullbooked = true WHERE id = p_trip_id;
  END IF;

  RETURN v_booking_id;
END;
$$;