
-- Activity log for booking events (emails, payments, changes)
CREATE TABLE public.booking_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_booking_id uuid NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'email_sent', 'payment', 'status_change', 'detail_change', 'document_upload'
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.booking_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all activity logs"
  ON public.booking_activity_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity logs"
  ON public.booking_activity_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_activity_log_booking ON public.booking_activity_log(trip_booking_id);
CREATE INDEX idx_activity_log_created ON public.booking_activity_log(created_at DESC);
