
-- 1. Trigger: assign partner role when admin approves partner_profiles
CREATE OR REPLACE FUNCTION public.handle_partner_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'partner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partner_status_change
  AFTER UPDATE OF status ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partner_approval();

-- 2. Partner listings (boenden)
CREATE TABLE public.partner_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  destination text NOT NULL,
  country text NOT NULL,
  address text,
  capacity integer NOT NULL DEFAULT 1,
  rooms integer,
  size_sqm integer,
  facilities text[],
  image_urls text[] DEFAULT '{}',
  image_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_listings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_partner_listings_updated_at
  BEFORE UPDATE ON public.partner_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: partners manage own, admins manage all, public sees approved
CREATE POLICY "Partners can view own listings"
  ON public.partner_listings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()
  ));

CREATE POLICY "Partners can insert own listings"
  ON public.partner_listings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid() AND pp.status = 'approved'
  ));

CREATE POLICY "Partners can update own listings"
  ON public.partner_listings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all listings"
  ON public.partner_listings FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all listings"
  ON public.partner_listings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete listings"
  ON public.partner_listings FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view approved listings"
  ON public.partner_listings FOR SELECT
  USING (status = 'approved');

-- 3. Listing availability / pricing per week
CREATE TABLE public.listing_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.partner_listings(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  price_per_week numeric NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, week_start)
);

ALTER TABLE public.listing_availability ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_listing_availability_updated_at
  BEFORE UPDATE ON public.listing_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
CREATE POLICY "Partners can manage own availability"
  ON public.listing_availability FOR ALL
  USING (EXISTS (
    SELECT 1 FROM partner_listings pl
    JOIN partner_profiles pp ON pp.id = pl.partner_id
    WHERE pl.id = listing_id AND pp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM partner_listings pl
    JOIN partner_profiles pp ON pp.id = pl.partner_id
    WHERE pl.id = listing_id AND pp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all availability"
  ON public.listing_availability FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view non-blocked availability for approved listings"
  ON public.listing_availability FOR SELECT
  USING (
    is_blocked = false AND EXISTS (
      SELECT 1 FROM partner_listings pl WHERE pl.id = listing_id AND pl.status = 'approved'
    )
  );

-- 4. Partner payouts (manually logged)
CREATE TABLE public.partner_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.partner_listings(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'SEK',
  payout_date date NOT NULL,
  reference text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_payouts ENABLE ROW LEVEL SECURITY;

-- RLS: admins full access, partners view own
CREATE POLICY "Admins can manage all payouts"
  ON public.partner_payouts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own payouts"
  ON public.partner_payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM partner_profiles pp WHERE pp.id = partner_id AND pp.user_id = auth.uid()
  ));
