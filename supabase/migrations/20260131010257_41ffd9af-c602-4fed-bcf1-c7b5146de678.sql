-- Add price column to trips table
ALTER TABLE public.trips 
ADD COLUMN price numeric NOT NULL DEFAULT 0;