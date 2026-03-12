
-- Table to temporarily store booking data while awaiting payment
CREATE TABLE public.pending_trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id),
  user_id uuid NOT NULL,
  booking_data jsonb NOT NULL,
  duffel_offer_id text,
  duffel_offer_data jsonb,
  flight_price_sek numeric DEFAULT 0,
  booking_fee_amount numeric NOT NULL,
  total_price numeric NOT NULL,
  discount_code text,
  discount_amount numeric DEFAULT 0,
  payment_method text,
  payment_reference text,
  status text NOT NULL DEFAULT 'awaiting_payment',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.pending_trip_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending bookings
CREATE POLICY "Users can view own pending bookings" ON public.pending_trip_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all pending bookings" ON public.pending_trip_bookings
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Table to store purchased Duffel flight info linked to a booking
CREATE TABLE public.trip_booking_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  duffel_order_id text,
  duffel_offer_id text,
  airline text,
  airline_logo text,
  flight_price_sek numeric NOT NULL DEFAULT 0,
  flight_price_original numeric,
  flight_currency_original text DEFAULT 'EUR',
  outbound_origin text,
  outbound_destination text,
  outbound_departure_time timestamptz,
  outbound_arrival_time timestamptz,
  outbound_stops integer DEFAULT 0,
  return_origin text,
  return_destination text,
  return_departure_time timestamptz,
  return_arrival_time timestamptz,
  return_stops integer DEFAULT 0,
  passengers integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_booking_flights ENABLE ROW LEVEL SECURITY;

-- Users can view flights for their bookings
CREATE POLICY "Users can view own booking flights" ON public.trip_booking_flights
  FOR SELECT TO authenticated
  USING (is_booking_owner(trip_booking_id, auth.uid()));

-- Travelers can view flights for bookings they're part of
CREATE POLICY "Travelers can view booking flights" ON public.trip_booking_flights
  FOR SELECT TO authenticated
  USING (is_traveler_on_booking(trip_booking_id, (auth.jwt() ->> 'email')));

-- Admins full access
CREATE POLICY "Admins can manage booking flights" ON public.trip_booking_flights
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
