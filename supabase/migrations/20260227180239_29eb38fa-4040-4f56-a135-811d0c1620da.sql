
CREATE TABLE public.trip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  name TEXT,
  capacity INTEGER,
  min_persons INTEGER,
  max_persons INTEGER,
  base_price NUMERIC,
  base_price_accommodation NUMERIC,
  base_price_flight NUMERIC,
  base_price_extras NUMERIC,
  price NUMERIC,
  departure_location TEXT,
  description TEXT,
  image_url TEXT,
  accommodation_rooms INTEGER,
  accommodation_size_sqm INTEGER,
  accommodation_facilities TEXT[],
  accommodation_address TEXT,
  accommodation_description TEXT,
  first_payment_amount NUMERIC,
  first_payment_type TEXT DEFAULT 'amount',
  first_payment_date DATE,
  second_payment_amount NUMERIC,
  second_payment_type TEXT DEFAULT 'amount',
  second_payment_date DATE,
  final_payment_amount NUMERIC,
  final_payment_type TEXT DEFAULT 'amount',
  final_payment_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all trip templates" ON public.trip_templates FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trip templates" ON public.trip_templates FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trip templates" ON public.trip_templates FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trip templates" ON public.trip_templates FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_trip_templates_updated_at BEFORE UPDATE ON public.trip_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
