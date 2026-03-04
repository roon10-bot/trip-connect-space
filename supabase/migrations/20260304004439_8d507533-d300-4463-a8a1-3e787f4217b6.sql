
-- Create a storage bucket for partner listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-listing-images', 'partner-listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Partners can upload their own listing images
CREATE POLICY "Partners can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-listing-images'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'partner')
);

-- Partners can delete their own listing images
CREATE POLICY "Partners can delete listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'partner-listing-images'
  AND auth.uid() IS NOT NULL
  AND has_role(auth.uid(), 'partner')
);

-- Anyone can view partner listing images (public bucket)
CREATE POLICY "Anyone can view partner listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-listing-images');

-- Admins can manage partner listing images
CREATE POLICY "Admins can manage partner listing images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'partner-listing-images'
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'partner-listing-images'
  AND has_role(auth.uid(), 'admin')
);
