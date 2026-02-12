
ALTER TABLE public.trips
ADD COLUMN accommodation_rooms integer NULL,
ADD COLUMN accommodation_size_sqm integer NULL,
ADD COLUMN accommodation_facilities text[] NULL,
ADD COLUMN accommodation_address text NULL,
ADD COLUMN accommodation_description text NULL;
