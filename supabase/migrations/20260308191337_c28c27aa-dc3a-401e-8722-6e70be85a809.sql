
UPDATE public.trips t
SET base_price_accommodation = COALESCE(pl.daily_price, 0) * 7,
    base_price = COALESCE(pl.daily_price, 0) * 7
FROM public.partner_listings pl
WHERE t.partner_listing_id = pl.id
  AND t.base_price_accommodation = 0
  AND pl.daily_price > 0;
