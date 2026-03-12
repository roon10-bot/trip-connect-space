
-- Service-role-only insert/update/delete for pending_trip_bookings is intentional.
-- Add admin policies for completeness.
CREATE POLICY "Admins can insert pending bookings" ON public.pending_trip_bookings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pending bookings" ON public.pending_trip_bookings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pending bookings" ON public.pending_trip_bookings
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
