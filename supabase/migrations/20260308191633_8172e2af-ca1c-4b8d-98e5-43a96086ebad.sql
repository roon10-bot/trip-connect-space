
UPDATE public.trips
SET price = CEIL((base_price_accommodation + base_price_extras) * 1.20)
WHERE partner_listing_id IS NOT NULL AND price = 0 AND base_price_accommodation > 0;
