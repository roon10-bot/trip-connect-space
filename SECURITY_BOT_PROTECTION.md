# Production Bot Protection System

## Översikt

Systemet skyddar bokningsflöden mot bottar och automatiserat spam genom:

1. **Persistent DB-baserad rate limiting** (ersätter in-memory)
2. **Cloudflare Turnstile CAPTCHA** (osynlig, användarvänlig)
3. **Server-side verifiering** i Edge Functions
4. **Loggning av blockerade försök** i databasen

---

## Turnstile Integration

### Frontend (Osynlig Widget)

**Hook:** `src/hooks/useTurnstile.ts`
- Renderar Cloudflare Turnstile-widget (compact mode)
- Returnerar token när användaren löst utmaningen
- Auto-reset vid fel

**Komponenter:**
- `BookingStep3.tsx` – Steg 3 i tripbokning (visar widget, skickar token till parent)
- `MeetingBookingForm.tsx` – Mötesbokning (inline widget)

**Implementation:**
```tsx
const { containerRef, token, error } = useTurnstile();

<div ref={containerRef} />  // Widget renderas här
<Button disabled={!token} onClick={() => onSubmit(token)}>Boka</Button>
```

### Backend (Server-side Verification)

**Edge Functions:**
- `create-trip-booking/index.ts`
- `create-meeting-booking/index.ts`

**Verifieringsflöde:**
1. Kräv `turnstile_token` i request body
2. Kalla `verifyTurnstile(token)` som POST:ar till Cloudflare API
3. Om verifiering misslyckas → 403 Forbidden
4. Annars fortsätt med bokning

**Secrets:**
- `TURNSTILE_SECRET_KEY` – Server-side nyckel (ALDRIG exponera i frontend)

---

## Rate Limiting (DB-baserad)

### Databas-funktion
**`check_rate_limit(p_key_type, p_key_value, p_endpoint, p_window_minutes, p_max_requests)`**

- Räknar requests i rullande tidsfönster
- Loggar varje försök i `rate_limit_log` (inkl. blockerade)
- Returnerar `true` om rate limit nådd, `false` annars

### Gränser (Produktionsklara)

**Trip Bookings (`create-trip-booking`):**
- **Per användare:** 10 bokningar/timme
- **Per IP:** 30 bokningar/timme (generös för delade IP:n)

**Meeting Bookings (`create-meeting-booking`):**
- **Per IP:** 15 bokningar/timme (skolor ofta delar IP)

### Varför dessa limits?

- **Blockerar bottar:** Ett bot-script kan inte göra 100+ requests/timme
- **Skyddar genuina användare:** Studenter på skolor/företagsnät delar ofta IP
- **Loggning:** Alla blockerade försök sparas för analys

---

## Loggning

**Tabell:** `public.rate_limit_log`

Kolumner:
- `key_type` – "user_id" eller "ip"
- `key_value` – UUID eller IP-adress
- `endpoint` – t.ex. "create-trip-booking"
- `blocked` – `true` om request blockerades
- `created_at` – Timestamp

**Auto-cleanup:**
- Funktion `cleanup_rate_limit_log()` raderar entries äldre än 24h
- Kan schemaläggas via pg_cron eller köras manuellt

---

## Säkerhet

### Vad som skyddas

✅ Bottar kan **inte** spamma bokningar (CAPTCHA krävs)  
✅ Rate limit förhindrar **massbokningar från samma IP/användare**  
✅ Alla blockerade försök **loggas för analys**  
✅ Server-side verifiering **förhindrar CAPTCHA-bypass**  
✅ DB-baserad rate limiting **fungerar över serveromstarter**  

### Vad som INTE skyddas

⚠️ DDoS på API-nivå (använd Cloudflare WAF/rate limiting för detta)  
⚠️ Sofistikerade bottar med roterande IP:n (överväg Cloudflare Bot Management)  

---

## Konfiguration

### Environment Variables (Secrets)

```
TURNSTILE_SECRET_KEY  # Cloudflare Turnstile server-side nyckel
```

### Frontend Turnstile Site Key

**Fil:** `src/hooks/useTurnstile.ts`

```typescript
const TURNSTILE_SITE_KEY = "0x4AAAAAABB_test_sitekey_here";
```

**För produktion:**
1. Skapa Turnstile-site på Cloudflare Dashboard
2. Kopiera **Site Key** (publik, kan vara i frontend)
3. Kopiera **Secret Key** → lägg i Supabase Secrets som `TURNSTILE_SECRET_KEY`
4. Uppdatera `TURNSTILE_SITE_KEY` i `useTurnstile.ts`

---

## Testing

### Turnstile Test Keys (Cloudflare)

**Always-pass sitekey (för utveckling):**
```
0x4AAAAAABB_test_sitekey_here (sitekey)
1x0000000000000000000000000000000AA (secret)
```

Används för att testa integration utan att lösa CAPTCHA.

### Rate Limit Testing

**SQL för att kontrollera loggar:**
```sql
SELECT * FROM rate_limit_log 
WHERE endpoint = 'create-trip-booking' 
ORDER BY created_at DESC 
LIMIT 50;
```

**SQL för att rensa test-data:**
```sql
DELETE FROM rate_limit_log WHERE key_value = 'test-user-id';
```

---

## Troubleshooting

### Problem: Turnstile-widget laddas inte

**Lösning:**
1. Kontrollera att Turnstile-skriptet laddas i `index.html`:
   ```html
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
   ```
2. Kolla browser console för fel
3. Verifiera att `TURNSTILE_SITE_KEY` är korrekt

### Problem: "Security verification failed" trots korrekt token

**Lösning:**
1. Kontrollera att `TURNSTILE_SECRET_KEY` är satt i Supabase secrets
2. Testa med Cloudflare test credentials för att isolera problemet
3. Kolla Edge Function logs för Turnstile API-svar

### Problem: Genuina användare blockeras av rate limit

**Lösning:**
1. Öka limits i Edge Functions (t.ex. 30 → 50 per IP/timme)
2. Överväg att kombinera IP + User-Agent för mer granulär tracking
3. Implementera whitelist för kända IP-ranges (t.ex. företag)

---

## Framtida Förbättringar

1. **Cloudflare WAF Rate Limiting** – Blockera trafik innan den når Edge Functions
2. **Bot Management** – Avancerad bot-detektering (kräver Cloudflare Enterprise)
3. **IP Geolocation** – Blockera requests från högrisk-länder
4. **Email-verifiering** – Kräv verifiering innan bokning bekräftas
5. **Payment hold** – Reservera bokningar med betalningsavsikt först

---

## Sammanfattning

Systemet är nu **produktionsredo** med:

- ✅ DB-baserad persistent rate limiting
- ✅ Cloudflare Turnstile CAPTCHA på alla bokningsflöden
- ✅ Server-side verifiering (säkert)
- ✅ Generösa limits för delade IP:n
- ✅ Full loggning av blockerade försök

**Rekommendation:** Övervaka `rate_limit_log` de första veckorna för att justera limits baserat på verklig trafik.
