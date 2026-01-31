-- Create enum for trip types
CREATE TYPE public.trip_type AS ENUM ('seglingsvecka', 'splitveckan', 'studentveckan');

-- Create trips table for admin-created trips
CREATE TABLE public.trips (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_type trip_type NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 20,
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    description TEXT,
    departure_location TEXT NOT NULL,
    
    -- Payment schedule with amounts and dates
    first_payment_amount NUMERIC NOT NULL DEFAULT 0,
    first_payment_date DATE,
    second_payment_amount NUMERIC NOT NULL DEFAULT 0,
    second_payment_date DATE,
    final_payment_amount NUMERIC NOT NULL DEFAULT 0,
    final_payment_date DATE,
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active trips"
ON public.trips
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all trips"
ON public.trips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert trips"
ON public.trips
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update trips"
ON public.trips
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete trips"
ON public.trips
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create discount_codes table for future use
CREATE TABLE public.discount_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount NUMERIC CHECK (discount_amount >= 0),
    valid_from DATE,
    valid_until DATE,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,
    
    -- Ensure at least one discount type is set
    CONSTRAINT discount_type_check CHECK (discount_percent IS NOT NULL OR discount_amount IS NOT NULL)
);

-- Enable Row Level Security
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for discount_codes
CREATE POLICY "Admins can view all discount codes"
ON public.discount_codes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert discount codes"
ON public.discount_codes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update discount codes"
ON public.discount_codes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete discount codes"
ON public.discount_codes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();