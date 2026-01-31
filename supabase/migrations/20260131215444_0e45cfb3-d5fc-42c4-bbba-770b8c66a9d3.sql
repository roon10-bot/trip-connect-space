-- Create trip_images table for multiple images per trip
CREATE TABLE public.trip_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view trip images (public)
CREATE POLICY "Anyone can view trip images"
ON public.trip_images
FOR SELECT
USING (true);

-- Only admins can insert trip images
CREATE POLICY "Admins can insert trip images"
ON public.trip_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update trip images
CREATE POLICY "Admins can update trip images"
ON public.trip_images
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete trip images
CREATE POLICY "Admins can delete trip images"
ON public.trip_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_trip_images_trip_id ON public.trip_images(trip_id);
CREATE INDEX idx_trip_images_order ON public.trip_images(trip_id, display_order);