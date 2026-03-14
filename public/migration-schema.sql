-- ============================================================
-- STUDENTRESOR – Full Database Schema Export
-- Generated: 2026-03-14
-- Run this in your new Supabase SQL Editor (in order)
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'partner');
CREATE TYPE public.payment_value_type AS ENUM ('percent', 'amount');
CREATE TYPE public.trip_type AS ENUM ('seglingsvecka', 'splitveckan', 'studentveckan');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  welcome_email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- destinations
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  description text,
  image_url text,
  price_from numeric NOT NULL,
  rating numeric DEFAULT 4.5,
  featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  destination_id uuid NOT NULL REFERENCES public.destinations(id),
  check_in date NOT NULL,
  check_out date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- booking_accommodations
CREATE TABLE public.booking_accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  hotel_name text NOT NULL,
  address text,
  room_type text,
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '11:00',
  amenities text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- booking_flights
CREATE TABLE public.booking_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  departure_city text NOT NULL,
  arrival_city text NOT NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  airline text,
  flight_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- booking_attachments
CREATE TABLE public.booking_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- partner_profiles
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_type text NOT NULL,
  first_name text,
  last_name text,
  personal_id text,
  company_name text,
  organization_number text,
  contact_person text,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  iban text NOT NULL,
  bank_name text,
  bank_address text,
  swift text,
  currency text,
  status text NOT NULL DEFAULT 'pending',
  certifies_rental_rights boolean NOT NULL DEFAULT false,
  certifies_local_taxes boolean NOT NULL DEFAULT false,
  certifies_company_authority boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- partner_status_history
CREATE TABLE public.partner_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id),
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- partner_listings
CREATE TABLE public.partner_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id),
  name text NOT NULL,
  description text,
  destination text NOT NULL,
  country text NOT NULL,
  address text,
  property_type text,
  access_type text,
  capacity integer NOT NULL DEFAULT 1,
  rooms integer,
  beds integer DEFAULT 1,
  bathrooms integer DEFAULT 1,
  size_sqm integer,
  daily_price numeric DEFAULT 0,
  facilities text[],
  image_url text,
  image_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- listing_availability
CREATE TABLE public.listing_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.partner_listings(id),
  week_start date NOT NULL,
  week_end date NOT NULL,
  price_per_week numeric NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, week_start)
);

-- partner_payouts
CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id),
  listing_id uuid REFERENCES public.partner_listings(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'SEK',
  payout_date date NOT NULL,
  period_start date,
  period_end date,
  reference text,
  notes text,
  status text NOT NULL DEFAULT 'planned',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- trips
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trip_type trip_type NOT NULL,
  departure_date date NOT NULL,
  return_date date NOT NULL,
  departure_location text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  base_price numeric DEFAULT 0,
  base_price_accommodation numeric NOT NULL DEFAULT 0,
  base_price_flight numeric NOT NULL DEFAULT 0,
  base_price_extras numeric NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 20,
  min_persons integer DEFAULT 1,
  max_persons integer DEFAULT 10,
  image_url text,
  accommodation_facilities text[],
  accommodation_address text,
  accommodation_description text,
  accommodation_rooms integer,
  accommodation_size_sqm integer,
  first_payment_amount numeric NOT NULL DEFAULT 0,
  first_payment_date date,
  first_payment_type payment_value_type NOT NULL DEFAULT 'amount',
  second_payment_amount numeric NOT NULL DEFAULT 0,
  second_payment_date date,
  second_payment_type payment_value_type NOT NULL DEFAULT 'amount',
  final_payment_amount numeric NOT NULL DEFAULT 0,
  final_payment_date date,
  final_payment_type payment_value_type NOT NULL DEFAULT 'amount',
  is_active boolean NOT NULL DEFAULT true,
  is_fullbooked boolean NOT NULL DEFAULT false,
  partner_listing_id uuid REFERENCES public.partner_listings(id),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trip_images
CREATE TABLE public.trip_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id),
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- trip_templates
CREATE TABLE public.trip_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  trip_type text NOT NULL,
  name text,
  description text,
  departure_location text,
  price numeric,
  base_price numeric,
  base_price_accommodation numeric,
  base_price_flight numeric,
  base_price_extras numeric,
  capacity integer,
  min_persons integer,
  max_persons integer,
  image_url text,
  image_urls text[] DEFAULT '{}',
  accommodation_facilities text[],
  accommodation_address text,
  accommodation_description text,
  accommodation_rooms integer,
  accommodation_size_sqm integer,
  first_payment_amount numeric,
  first_payment_date date,
  first_payment_type text DEFAULT 'amount',
  second_payment_amount numeric,
  second_payment_date date,
  second_payment_type text DEFAULT 'amount',
  final_payment_amount numeric,
  final_payment_date date,
  final_payment_type text DEFAULT 'amount',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trip_bookings
CREATE TABLE public.trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birth_date date NOT NULL,
  departure_location text NOT NULL,
  travelers integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  discount_code text,
  discount_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trip_booking_travelers
CREATE TABLE public.trip_booking_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id),
  traveler_index integer NOT NULL DEFAULT 0,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birth_date date NOT NULL,
  departure_location text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- trip_booking_flights
CREATE TABLE public.trip_booking_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id),
  airline text,
  airline_logo text,
  duffel_offer_id text,
  duffel_order_id text,
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

-- trip_booking_documents
CREATE TABLE public.trip_booking_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id),
  user_id uuid,
  amount numeric NOT NULL,
  payment_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_provider text,
  provider_session_id text,
  provider_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pending_trip_bookings
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

-- booking_activity_log
CREATE TABLE public.booking_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id),
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- meeting_slots
CREATE TABLE public.meeting_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  meet_link text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- meeting_bookings
CREATE TABLE public.meeting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.meeting_slots(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  school text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- discount_codes
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_percent integer,
  discount_amount numeric,
  valid_from date,
  valid_until date,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- email_templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  heading text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#38bdf8',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- rate_limit_log
CREATE TABLE public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type text NOT NULL,
  key_value text NOT NULL,
  endpoint text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_booking_owner(booking_id uuid, check_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_bookings WHERE id = booking_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_traveler_on_booking(booking_id uuid, user_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_booking_travelers t
    WHERE t.trip_booking_id = booking_id AND t.email = user_email
  );
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key_type text, p_key_value text, p_endpoint text,
  p_window_minutes integer, p_max_requests integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  request_count integer;
BEGIN
  SELECT count(*) INTO request_count
  FROM public.rate_limit_log
  WHERE key_type = p_key_type AND key_value = p_key_value
    AND endpoint = p_endpoint
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  IF request_count >= p_max_requests THEN
    INSERT INTO public.rate_limit_log (key_type, key_value, endpoint, blocked)
    VALUES (p_key_type, p_key_value, p_endpoint, true);
    RETURN true;
  END IF;

  INSERT INTO public.rate_limit_log (key_type, key_value, endpoint, blocked)
  VALUES (p_key_type, p_key_value, p_endpoint, false);
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_log()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  DELETE FROM public.rate_limit_log WHERE created_at < now() - interval '24 hours';
$$;

CREATE OR REPLACE FUNCTION public.handle_partner_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'partner';
    UPDATE public.partner_listings
    SET status = 'suspended', updated_at = now()
    WHERE partner_id = NEW.id AND status IN ('approved', 'pending');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_partner_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.partner_status_history (partner_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_listing_availability()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  listing_status text;
BEGIN
  SELECT status INTO listing_status FROM public.partner_listings WHERE id = NEW.listing_id;
  IF listing_status IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF listing_status NOT IN ('approved', 'pending') THEN
    RAISE EXCEPTION 'Cannot modify availability for a % listing', listing_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_trip_from_approved_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  new_trip_id uuid;
  listing_price numeric;
  computed_price numeric;
  num_nights integer;
  dep_date date;
  ret_date date;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    dep_date := (CURRENT_DATE + INTERVAL '30 days')::date;
    ret_date := (CURRENT_DATE + INTERVAL '37 days')::date;
    num_nights := ret_date - dep_date;
    listing_price := COALESCE(NEW.daily_price, 0) * num_nights;
    computed_price := CEIL(COALESCE(listing_price, 0) * 1.20);

    INSERT INTO public.trips (
      name, description, trip_type,
      departure_date, return_date, departure_location,
      price, capacity, image_url,
      accommodation_facilities, accommodation_address,
      accommodation_rooms, accommodation_size_sqm, accommodation_description,
      is_active, created_by, partner_listing_id,
      base_price_accommodation, base_price, min_persons, max_persons
    ) VALUES (
      NEW.name, NEW.description, 'splitveckan',
      dep_date, ret_date, 'TBD',
      computed_price, NEW.capacity, NEW.image_url,
      NEW.facilities, NEW.address,
      NEW.rooms, NEW.size_sqm, NEW.description,
      false,
      COALESCE(auth.uid(), (SELECT user_id FROM public.partner_profiles WHERE id = NEW.partner_id)),
      NEW.id,
      COALESCE(listing_price, 0), COALESCE(listing_price, 0),
      1, NEW.capacity
    ) RETURNING id INTO new_trip_id;

    IF NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0 THEN
      INSERT INTO public.trip_images (trip_id, image_url, display_order)
      SELECT new_trip_id, url, idx - 1
      FROM unnest(NEW.image_urls) WITH ORDINALITY AS t(url, idx);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_trip_booking_atomic(
  p_trip_id uuid, p_user_id uuid, p_first_name text, p_last_name text,
  p_email text, p_birth_date date, p_phone text, p_departure_location text,
  p_travelers integer, p_total_price numeric,
  p_discount_code text DEFAULT NULL, p_discount_amount numeric DEFAULT 0
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_capacity integer; v_is_fullbooked boolean; v_is_active boolean;
  v_current_travelers integer; v_booking_id uuid; v_spots_left integer;
BEGIN
  SELECT capacity, is_fullbooked, is_active INTO v_capacity, v_is_fullbooked, v_is_active
  FROM public.trips WHERE id = p_trip_id FOR UPDATE;

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
  ) RETURNING id INTO v_booking_id;

  IF (v_current_travelers + p_travelers) >= v_capacity THEN
    UPDATE public.trips SET is_fullbooked = true WHERE id = p_trip_id;
  END IF;

  RETURN v_booking_id;
END;
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE TRIGGER on_partner_profile_status_change
  AFTER UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_partner_approval();

CREATE TRIGGER on_partner_status_log
  AFTER UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_partner_status_change();

CREATE TRIGGER on_listing_availability_validate
  BEFORE INSERT OR UPDATE ON public.listing_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_listing_availability();

CREATE TRIGGER on_listing_approved_create_trip
  AFTER UPDATE ON public.partner_listings
  FOR EACH ROW EXECUTE FUNCTION public.create_trip_from_approved_listing();

-- updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.booking_accommodations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.booking_flights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.partner_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.partner_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.listing_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trip_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trip_booking_travelers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.meeting_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trip_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_booking_travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_booking_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- destinations
CREATE POLICY "Anyone can view destinations" ON public.destinations FOR SELECT USING (true);

-- bookings
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookings" ON public.bookings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all bookings" ON public.bookings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete all bookings" ON public.bookings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- booking_accommodations
CREATE POLICY "Users can view their booking accommodations" ON public.booking_accommodations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_accommodations.booking_id AND bookings.user_id = auth.uid()));
CREATE POLICY "Admins can view all booking accommodations" ON public.booking_accommodations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert booking accommodations" ON public.booking_accommodations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update booking accommodations" ON public.booking_accommodations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete booking accommodations" ON public.booking_accommodations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- booking_flights (admin only insert/delete already in schema context)
CREATE POLICY "Admins can insert booking flights" ON public.booking_flights FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete booking flights" ON public.booking_flights FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- booking_attachments
CREATE POLICY "Users can view their booking attachments" ON public.booking_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_attachments.booking_id AND bookings.user_id = auth.uid()));
CREATE POLICY "Admins can view all booking attachments" ON public.booking_attachments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert booking attachments" ON public.booking_attachments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete booking attachments" ON public.booking_attachments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- partner_profiles
CREATE POLICY "Users can insert their own partner profile" ON public.partner_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own partner profile" ON public.partner_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own partner profile" ON public.partner_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all partner profiles" ON public.partner_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all partner profiles" ON public.partner_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete partner profiles" ON public.partner_profiles FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- partner_status_history
CREATE POLICY "Admins can view all status history" ON public.partner_status_history FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert status history" ON public.partner_status_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- partner_listings
CREATE POLICY "Anyone can view approved listings" ON public.partner_listings FOR SELECT USING (status = 'approved');
CREATE POLICY "Partners can view own listings" ON public.partner_listings FOR SELECT USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_listings.partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Partners can insert own listings" ON public.partner_listings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_listings.partner_id AND pp.user_id = auth.uid() AND pp.status = 'approved'));
CREATE POLICY "Partners can update own listings" ON public.partner_listings FOR UPDATE USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_listings.partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Partners can delete own pending/suspended listings" ON public.partner_listings FOR DELETE TO authenticated USING (status IN ('pending', 'suspended') AND EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_listings.partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can view all listings" ON public.partner_listings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all listings" ON public.partner_listings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete listings" ON public.partner_listings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- listing_availability
CREATE POLICY "Anyone can view non-blocked availability for approved listings" ON public.listing_availability FOR SELECT USING (is_blocked = false AND EXISTS (SELECT 1 FROM partner_listings pl WHERE pl.id = listing_availability.listing_id AND pl.status = 'approved'));
CREATE POLICY "Partners can manage own availability" ON public.listing_availability FOR ALL USING (EXISTS (SELECT 1 FROM partner_listings pl JOIN partner_profiles pp ON pp.id = pl.partner_id WHERE pl.id = listing_availability.listing_id AND pp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM partner_listings pl JOIN partner_profiles pp ON pp.id = pl.partner_id WHERE pl.id = listing_availability.listing_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can manage all availability" ON public.listing_availability FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- partner_payouts
CREATE POLICY "Partners can view own payouts" ON public.partner_payouts FOR SELECT USING (EXISTS (SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_payouts.partner_id AND pp.user_id = auth.uid()));
CREATE POLICY "Admins can manage all payouts" ON public.partner_payouts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- trips
CREATE POLICY "Anyone can view active trips" ON public.trips FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all trips" ON public.trips FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trips" ON public.trips FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trips" ON public.trips FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trips" ON public.trips FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- trip_images
CREATE POLICY "Anyone can view trip images" ON public.trip_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert trip images" ON public.trip_images FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trip images" ON public.trip_images FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip images" ON public.trip_images FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- trip_templates
CREATE POLICY "Admins can view all trip templates" ON public.trip_templates FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trip templates" ON public.trip_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trip templates" ON public.trip_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip templates" ON public.trip_templates FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- trip_bookings
CREATE POLICY "Users can view their own trip bookings" ON public.trip_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Travelers can view bookings they are part of" ON public.trip_bookings FOR SELECT USING (is_traveler_on_booking(id, auth.jwt() ->> 'email'));
CREATE POLICY "Admins can view all trip bookings" ON public.trip_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trip bookings" ON public.trip_bookings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip bookings" ON public.trip_bookings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- trip_booking_travelers
CREATE POLICY "Users can view their own trip booking travelers" ON public.trip_booking_travelers FOR SELECT USING (is_booking_owner(trip_booking_id, auth.uid()));
CREATE POLICY "Travelers can view their own traveler records" ON public.trip_booking_travelers FOR SELECT USING (email = (auth.jwt() ->> 'email'));
CREATE POLICY "Deny anonymous access to travelers" ON public.trip_booking_travelers AS RESTRICTIVE FOR SELECT TO anon USING (false);
CREATE POLICY "Admins can view all trip booking travelers" ON public.trip_booking_travelers FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trip booking travelers" ON public.trip_booking_travelers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trip booking travelers" ON public.trip_booking_travelers FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip booking travelers" ON public.trip_booking_travelers FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- trip_booking_flights
CREATE POLICY "Users can view own booking flights" ON public.trip_booking_flights FOR SELECT TO authenticated USING (is_booking_owner(trip_booking_id, auth.uid()));
CREATE POLICY "Travelers can view booking flights" ON public.trip_booking_flights FOR SELECT TO authenticated USING (is_traveler_on_booking(trip_booking_id, auth.jwt() ->> 'email'));
CREATE POLICY "Admins can manage booking flights" ON public.trip_booking_flights FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- trip_booking_documents
CREATE POLICY "Users can view documents for their bookings" ON public.trip_booking_documents FOR SELECT USING (is_booking_owner(trip_booking_id, auth.uid()));
CREATE POLICY "Travelers can view documents for their bookings" ON public.trip_booking_documents FOR SELECT USING (is_traveler_on_booking(trip_booking_id, auth.jwt() ->> 'email'));
CREATE POLICY "Admins can view all trip booking documents" ON public.trip_booking_documents FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trip booking documents" ON public.trip_booking_documents FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip booking documents" ON public.trip_booking_documents FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Travelers can view payments for their bookings" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM trip_booking_travelers t WHERE t.trip_booking_id = payments.trip_booking_id AND t.email = (auth.jwt() ->> 'email')));
CREATE POLICY "Travelers can insert payments for their bookings" ON public.payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trip_booking_travelers t WHERE t.trip_booking_id = payments.trip_booking_id AND t.email = (auth.jwt() ->> 'email')) AND auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert payments" ON public.payments FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- pending_trip_bookings
CREATE POLICY "Users can view own pending bookings" ON public.pending_trip_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all pending bookings" ON public.pending_trip_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert pending bookings" ON public.pending_trip_bookings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pending bookings" ON public.pending_trip_bookings FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pending bookings" ON public.pending_trip_bookings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- booking_activity_log
CREATE POLICY "Admins can view all activity logs" ON public.booking_activity_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert activity logs" ON public.booking_activity_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- meeting_slots
CREATE POLICY "Anyone can view available meeting slots" ON public.meeting_slots FOR SELECT USING (is_booked = false);
CREATE POLICY "Admins can view all meeting slots" ON public.meeting_slots FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert meeting slots" ON public.meeting_slots FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update meeting slots" ON public.meeting_slots FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete meeting slots" ON public.meeting_slots FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- meeting_bookings
CREATE POLICY "Admins can view all meeting bookings" ON public.meeting_bookings FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete meeting bookings" ON public.meeting_bookings FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- discount_codes
CREATE POLICY "Admins can view all discount codes" ON public.discount_codes FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert discount codes" ON public.discount_codes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update discount codes" ON public.discount_codes FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete discount codes" ON public.discount_codes FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- email_templates
CREATE POLICY "Admins can view email templates" ON public.email_templates FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert email templates" ON public.email_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update email templates" ON public.email_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- 7. STORAGE BUCKETS (run in Supabase dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('partner-listing-images', 'partner-listing-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('booking-attachments', 'booking-attachments', false);

-- ============================================================
-- 8. REALTIME (if needed)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_trip_bookings;
