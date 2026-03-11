
-- Rename stripe-specific columns to provider-agnostic names
ALTER TABLE public.payments RENAME COLUMN stripe_payment_intent_id TO provider_transaction_id;
ALTER TABLE public.payments RENAME COLUMN stripe_session_id TO provider_session_id;

-- Add payment_provider column to track which provider processed the payment
ALTER TABLE public.payments ADD COLUMN payment_provider text DEFAULT NULL;
