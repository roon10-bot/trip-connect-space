
-- Add partner_listing_id to trips to track partner-sourced trips
ALTER TABLE public.trips
ADD COLUMN partner_listing_id uuid REFERENCES public.partner_listings(id) ON DELETE SET NULL;

-- Create index for lookups
CREATE INDEX idx_trips_partner_listing_id ON public.trips (partner_listing_id);

-- Update the trigger function to set partner_listing_id
CREATE OR REPLACE FUNCTION public.create_trip_from_approved_listing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_trip_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.trips (
      name,
      description,
      trip_type,
      departure_date,
      return_date,
      departure_location,
      price,
      capacity,
      image_url,
      accommodation_facilities,
      accommodation_address,
      accommodation_rooms,
      accommodation_size_sqm,
      accommodation_description,
      is_active,
      created_by,
      partner_listing_id
    ) VALUES (
      NEW.name,
      NEW.description,
      'splitveckan',
      (CURRENT_DATE + INTERVAL '30 days')::date,
      (CURRENT_DATE + INTERVAL '37 days')::date,
      'TBD',
      0,
      NEW.capacity,
      NEW.image_url,
      NEW.facilities,
      NEW.address,
      NEW.rooms,
      NEW.size_sqm,
      NEW.description,
      false,
      COALESCE(auth.uid(), (SELECT user_id FROM public.partner_profiles WHERE id = NEW.partner_id)),
      NEW.id
    )
    RETURNING id INTO new_trip_id;

    -- Copy images to trip_images if available
    IF NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0 THEN
      INSERT INTO public.trip_images (trip_id, image_url, display_order)
      SELECT 
        new_trip_id,
        url,
        idx - 1
      FROM unnest(NEW.image_urls) WITH ORDINALITY AS t(url, idx);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
