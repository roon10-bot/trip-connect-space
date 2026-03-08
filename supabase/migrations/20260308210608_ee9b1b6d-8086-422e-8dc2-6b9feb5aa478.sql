CREATE POLICY "Partners can delete own pending/suspended listings"
ON public.partner_listings
FOR DELETE
TO authenticated
USING (
  status IN ('pending', 'suspended')
  AND EXISTS (
    SELECT 1 FROM partner_profiles pp
    WHERE pp.id = partner_listings.partner_id
    AND pp.user_id = auth.uid()
  )
);