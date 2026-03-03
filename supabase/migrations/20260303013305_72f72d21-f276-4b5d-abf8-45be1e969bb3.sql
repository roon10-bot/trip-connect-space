
-- Add 'partner' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- Create partner_profiles table for host-specific data
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  partner_type text NOT NULL CHECK (partner_type IN ('individual', 'company')),
  
  -- Individual fields
  first_name text,
  last_name text,
  personal_id text, -- personnummer / ID-nummer
  
  -- Company fields
  company_name text,
  organization_number text, -- organisationsnummer / OIB
  contact_person text,
  
  -- Shared fields
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  
  -- Payment
  iban text NOT NULL,
  bank_name text, -- for individuals
  bank_address text, -- for individuals
  swift text, -- for companies
  currency text, -- for companies
  
  -- Legal
  certifies_rental_rights boolean NOT NULL DEFAULT false,
  certifies_local_taxes boolean NOT NULL DEFAULT false,
  certifies_company_authority boolean NOT NULL DEFAULT false,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own partner profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own partner profile"
  ON public.partner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partner profiles"
  ON public.partner_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all partner profiles"
  ON public.partner_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner profiles"
  ON public.partner_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
