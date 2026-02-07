
-- Table for admin-created available time slots
CREATE TABLE public.meeting_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view available (non-booked) slots
CREATE POLICY "Anyone can view available meeting slots"
ON public.meeting_slots FOR SELECT
USING (is_booked = false);

-- Admins can view all slots
CREATE POLICY "Admins can view all meeting slots"
ON public.meeting_slots FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert slots
CREATE POLICY "Admins can insert meeting slots"
ON public.meeting_slots FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update slots
CREATE POLICY "Admins can update meeting slots"
ON public.meeting_slots FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete slots
CREATE POLICY "Admins can delete meeting slots"
ON public.meeting_slots FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_meeting_slots_updated_at
BEFORE UPDATE ON public.meeting_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table for meeting bookings made by visitors
CREATE TABLE public.meeting_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.meeting_slots(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  school text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a booking (public form)
CREATE POLICY "Anyone can create meeting bookings"
ON public.meeting_bookings FOR INSERT
WITH CHECK (true);

-- Admins can view all bookings
CREATE POLICY "Admins can view all meeting bookings"
ON public.meeting_bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete bookings
CREATE POLICY "Admins can delete meeting bookings"
ON public.meeting_bookings FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
