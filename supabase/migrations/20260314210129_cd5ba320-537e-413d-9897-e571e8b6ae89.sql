
INSERT INTO public.email_templates (template_key, name, subject, heading, body_text, button_text, footer_text, primary_color, logo_url, is_active)
VALUES
  (
    'auth_signup',
    'Bekräfta registrering',
    'Välkommen till Studentresor – Bekräfta din e-post',
    'Välkommen till Studentresor!',
    'Tack för att du skapar ett konto hos oss. Vi hjälper studenter att upptäcka världen – med trygga, prisvärda resor skräddarsydda för er.\n\nKlicka på knappen nedan för att bekräfta din e-postadress och komma igång.',
    'Bekräfta min e-post',
    'Om du inte skapade detta konto kan du ignorera detta meddelande.\n© Studentresor AB',
    '#0C4D73',
    NULL,
    true
  ),
  (
    'auth_recovery',
    'Återställ lösenord',
    'Återställ ditt lösenord – Studentresor',
    'Återställ ditt lösenord',
    'Vi har fått en förfrågan om att återställa lösenordet kopplat till {{email}}.\n\nKlicka på knappen nedan för att välja ett nytt lösenord. Länken är giltig i 24 timmar.',
    'Välj nytt lösenord',
    'Om du inte begärde detta kan du ignorera detta meddelande. Ditt lösenord förblir oförändrat.\n© Studentresor AB',
    '#0C4D73',
    NULL,
    true
  ),
  (
    'auth_magiclink',
    'Magisk inloggningslänk',
    'Din inloggningslänk – Studentresor',
    'Logga in på Studentresor',
    'Klicka på knappen nedan för att logga in på ditt konto. Länken är giltig i 10 minuter.',
    'Logga in',
    'Om du inte begärde detta kan du ignorera detta meddelande.\n© Studentresor AB',
    '#0C4D73',
    NULL,
    true
  ),
  (
    'auth_invite',
    'Inbjudan',
    'Du har blivit inbjuden till Studentresor',
    'Välkommen till Studentresor!',
    'Du har blivit inbjuden att skapa ett konto på Studentresor.\n\nKlicka på knappen nedan för att acceptera inbjudan och komma igång.',
    'Acceptera inbjudan',
    'Om du inte förväntar dig denna inbjudan kan du ignorera detta meddelande.\n© Studentresor AB',
    '#0C4D73',
    NULL,
    true
  ),
  (
    'auth_email_change',
    'Bekräfta e-postbyte',
    'Bekräfta din nya e-postadress – Studentresor',
    'Bekräfta din nya e-postadress',
    'Du har begärt att byta e-postadress för ditt konto på Studentresor.\n\nKlicka på knappen nedan för att bekräfta din nya adress.',
    'Bekräfta e-postadress',
    'Om du inte begärde detta kan du ignorera detta meddelande.\n© Studentresor AB',
    '#0C4D73',
    NULL,
    true
  )
ON CONFLICT (template_key) DO NOTHING;
