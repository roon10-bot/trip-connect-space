-- Create email_templates table for admin-editable email templates
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  heading text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT '',
  footer_text text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#38bdf8',
  logo_url text DEFAULT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can view email templates"
ON public.email_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email templates"
ON public.email_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default templates
INSERT INTO public.email_templates (template_key, name, subject, heading, body_text, button_text, footer_text) VALUES
(
  'invite_traveler',
  'Kontoinbjudan (resenärer)',
  'Välkommen till Studentresor – Aktivera ditt konto',
  'Välkommen till Studentresor!',
  'Du har blivit tillagd som resenär på resan {{trip_name}} ({{trip_type}}), {{departure_date}} – {{return_date}}. Klicka på knappen nedan för att aktivera ditt konto och se dina resedokument.',
  'Aktivera mitt konto',
  'Om du inte förväntar dig detta mail kan du ignorera det.'
),
(
  'meeting_confirmation',
  'Mötesbekräftelse',
  'Bekräftelse av ditt möte med Studentresor',
  'Mötesbekräftelse',
  'Hej {{name}}, ditt möte är bokat den {{date}} kl. {{time}}. Vi ser fram emot att prata med dig!',
  'Öppna mötet',
  'Har du frågor? Kontakta oss på info@studentresor.com'
),
(
  'contact_confirmation',
  'Kontaktformulär-bekräftelse',
  'Vi har mottagit ditt meddelande',
  'Tack för ditt meddelande!',
  'Hej {{name}}, vi har mottagit ditt meddelande och återkommer så snart vi kan.',
  '',
  'Studentresor – Vi gör drömresor till verklighet'
);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();