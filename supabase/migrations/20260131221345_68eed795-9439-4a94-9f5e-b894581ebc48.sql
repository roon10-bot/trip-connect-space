-- Create enum for payment value type
CREATE TYPE public.payment_value_type AS ENUM ('percent', 'amount');

-- Add payment type columns to trips table
ALTER TABLE public.trips 
ADD COLUMN first_payment_type payment_value_type NOT NULL DEFAULT 'amount',
ADD COLUMN second_payment_type payment_value_type NOT NULL DEFAULT 'amount',
ADD COLUMN final_payment_type payment_value_type NOT NULL DEFAULT 'amount';