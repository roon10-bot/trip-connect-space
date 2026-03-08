
CREATE OR REPLACE FUNCTION public.create_trip_from_approved_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_trip_id uuid;
  listing_price numeric;
  computed_price numeric;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Always use daily_price * 7 from the listing
    listing_price := COALESCE(NEW.daily_price, 0) * 7;

    computed_price := CEIL(COALESCE(listing_price, 0) * 1.20);

    INSERT INTO public.trips (
      name, description, trip_type,
      departure_date, return_date, departure_location,
      price, capacity, image_url,
      accommodation_facilities, accommodation_address,
      accommodation_rooms, accommodation_size_sqm, accommodation_description,
      is_active, created_by, partner_listing_id,
      base_price_accommodation, base_price
    ) VALUES (
      NEW.name, NEW.description, 'splitveckan',
      (CURRENT_DATE + INTERVAL '30 days')::date,
      (CURRENT_DATE + INTERVAL '37 days')::date,
      'TBD',
      computed_price,
      NEW.capacity, NEW.image_url,
      NEW.facilities, NEW.address,
      NEW.rooms, NEW.size_sqm, NEW.description,
      false,
      COALESCE(auth.uid(), (SELECT user_id FROM public.partner_profiles WHERE id = NEW.partner_id)),
      NEW.id,
      COALESCE(listing_price, 0),
      COALESCE(listing_price, 0)
    )
    RETURNING id INTO new_trip_id;

    IF NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0 THEN
      INSERT INTO public.trip_images (trip_id, image_url, display_order)
      SELECT new_trip_id, url, idx - 1
      FROM unnest(NEW.image_urls) WITH ORDINALITY AS t(url, idx);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
