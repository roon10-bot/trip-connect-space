
-- 1. Unique constraint on listing_availability (listing_id + week_start)
ALTER TABLE public.listing_availability
ADD CONSTRAINT listing_availability_listing_week_unique UNIQUE (listing_id, week_start);

-- 2. Auto-suspend listings when partner is revoked (update trigger)
CREATE OR REPLACE FUNCTION public.handle_partner_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- When approved: grant partner role
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- When revoked: remove partner role AND suspend all their listings
  IF NEW.status != 'approved' AND OLD.status = 'approved' THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'partner';

    UPDATE public.partner_listings
    SET status = 'suspended', updated_at = now()
    WHERE partner_id = NEW.id
      AND status IN ('approved', 'pending');
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Block availability changes for non-approved listings (validation trigger)
CREATE OR REPLACE FUNCTION public.validate_listing_availability()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  listing_status text;
BEGIN
  SELECT status INTO listing_status
  FROM public.partner_listings
  WHERE id = NEW.listing_id;

  IF listing_status IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF listing_status NOT IN ('approved', 'pending') THEN
    RAISE EXCEPTION 'Cannot modify availability for a % listing', listing_status;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_availability_before_insert_update
BEFORE INSERT OR UPDATE ON public.listing_availability
FOR EACH ROW
EXECUTE FUNCTION public.validate_listing_availability();

-- 5. Add missing fields to partner_payouts
ALTER TABLE public.partner_payouts
ADD COLUMN IF NOT EXISTS period_start date,
ADD COLUMN IF NOT EXISTS period_end date,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planned';

-- 6. Audit table for partner status changes
CREATE TABLE public.partner_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all status history"
ON public.partner_status_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert status history"
ON public.partner_status_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-log status changes via trigger
CREATE OR REPLACE FUNCTION public.log_partner_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.partner_status_history (partner_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_partner_status_change
AFTER UPDATE ON public.partner_profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_partner_status_change();
