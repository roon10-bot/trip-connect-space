-- Add image_url column to trips table
ALTER TABLE public.trips 
ADD COLUMN image_url text;

-- Create storage bucket for trip images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trip-images', 'trip-images', true);

-- Allow anyone to view trip images (public bucket)
CREATE POLICY "Anyone can view trip images"
ON storage.objects FOR SELECT
USING (bucket_id = 'trip-images');

-- Allow admins to upload trip images
CREATE POLICY "Admins can upload trip images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trip-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update trip images
CREATE POLICY "Admins can update trip images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trip-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete trip images
CREATE POLICY "Admins can delete trip images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trip-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);