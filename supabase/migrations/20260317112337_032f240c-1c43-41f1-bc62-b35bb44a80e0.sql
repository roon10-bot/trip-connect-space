
-- Add missing fields to trip_booking_travelers
ALTER TABLE public.trip_booking_travelers
  ADD COLUMN IF NOT EXISTS passport_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS school text;

-- Add project_number field to trips
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS project_number text;

-- Add project_number field to trip_templates too
ALTER TABLE public.trip_templates
  ADD COLUMN IF NOT EXISTS project_number text;
