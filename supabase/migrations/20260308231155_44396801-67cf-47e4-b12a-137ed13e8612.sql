INSERT INTO public.email_templates (template_key, name, subject, heading, body_text, button_text, footer_text, primary_color)
VALUES (
  'host_booking_notification',
  'Bokningsnotis till värd',
  'Ny bokning för {{listing_name}}',
  'Du har en ny bokning!',
  'Hej {{host_name}},\n\nEtt boende har blivit bokat:\n\n🏠 Boende: {{listing_name}}\n📅 Datum: {{departure_date}} – {{return_date}}\n👥 Antal resenärer: {{travelers}}\n🎫 Resans namn: {{trip_name}}\n\nDu kan se dina bokningar i värdportalen.',
  'Gå till värdportalen',
  'Detta är ett automatiskt meddelande från Studentresor.\nKontakta oss på info@studentresor.com vid frågor.',
  '#38bdf8'
);