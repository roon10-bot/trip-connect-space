
-- Drop the old SELECT policy and create an updated one that also covers trip_booking_documents
DROP POLICY IF EXISTS "Users can view their booking attachments in storage" ON storage.objects;

CREATE POLICY "Users can view their booking attachments in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'booking-attachments'
  AND (
    -- Admins can see all
    has_role(auth.uid(), 'admin'::app_role)
    -- Legacy: booking_attachments linked to bookings
    OR EXISTS (
      SELECT 1 FROM booking_attachments ba
      JOIN bookings b ON ba.booking_id = b.id
      WHERE ba.file_url LIKE '%' || objects.name
      AND b.user_id = auth.uid()
    )
    -- New: trip_booking_documents - booking owner
    OR EXISTS (
      SELECT 1 FROM trip_booking_documents tbd
      WHERE tbd.file_url = objects.name
      AND is_booking_owner(tbd.trip_booking_id, auth.uid())
    )
    -- New: trip_booking_documents - traveler on booking
    OR EXISTS (
      SELECT 1 FROM trip_booking_documents tbd
      WHERE tbd.file_url = objects.name
      AND is_traveler_on_booking(tbd.trip_booking_id, (auth.jwt() ->> 'email'::text))
    )
  )
);
