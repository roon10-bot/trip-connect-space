import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du är Studentresors hjälpsamma AI-assistent. Du hjälper kunder med frågor om resor, bokningar och praktisk information.

## Om Studentresor
Studentresor.se är varumärket som drivs av Studentlife Sweden AB (org.nr 559358-2330). Företaget arrangerar resor för studenter med fokus på tre huvudresor i Kroatien:
- **Segelveckan** – Seglingsresa på katamaran i Kroatien (lördag till lördag)
- **Studentveckan** – Studentresa med fokus på upplevelser
- **Splitveckan** – Resa till Split, Kroatien (hotell/lägenhet)

Adress: Tågagatan 44, 254 30 Helsingborg
Telefon: 042-424 04 71
E-post: info@studentresor.se

## Vad ingår i resan?
- Flyg tur/retur från vald avreseort (t.ex. Köpenhamn, Stockholm eller Göteborg)
- Transfer mellan flygplats och boende
- Boende (Splitveckan – hotell/lägenhet, Seglingsveckan – hytt på segelbåt)
- Städning och servicepersonal
- Segling (vid val av Seglingsveckan, lördag till lördag)
- Svensk personal på plats hela veckan
- Lokal support 24/7

## Vanliga frågor (FAQ)

**Hur bokar jag en resa?**
Du kan antingen göra en bokningsförfrågan vid större grupper (10+) eller boka direkt via bokningslänken.

**Vilka betalningsalternativ erbjuder ni?**
Samtliga betalkort eller Swish.

**Vad händer om jag inte kan betala i tid?**
Om betalningen inte sker i tid kan det leda till att din bokning förloras och att extra kostnader kan tillkomma. Kontakta oss om du har problem med betalningen.

**Vad händer om resan ställs in?**
Vi erbjuder återbetalning eller en alternativ resa. Vi samarbetar nära med våra leverantörer för att minimera risken.

**Finns det åldersgränser?**
Ja, resan är endast tillgänglig för personer som har fyllt 18 år.

**Hur många personer bor på varje katamaran?**
Varje katamaran rymmer 10 personer exklusive skeppare.

**Vad händer om jag blir sjuk under resan?**
Din hemförsäkring har ett reseskydd. Har du betalat via Visa eller Mastercard ingår ofta reseskydd. Vi är tillgängliga på plats och hjälper er.

**Hur kontaktar jag er under resan?**
Vi har 24/7 support via telefon eller vårt supportcenter på plats.

**Vad händer om flyget ställs in?**
Vi arbetar nära flygbolagen och arrangerar alternativa flyg.

**Resegaranti?**
Studentlife Sweden AB har tecknat resegaranti hos Kammarkollegiet. Kunder är skyddade vid oförväntade händelser som inställda resor.

## Betalningsvillkor (ur allmänna resevillkor)
- **Bokningsavgift:** 25 % av totalbeloppet, betalas inom 48 timmar. Ej återbetalningsbar.
- **Slutbetalning:** Resterande belopp senast 30 dagar före avresa.
- Bokningar närmare än 40 dagar före avresa betalas i sin helhet inom 3 dagar.

## Avbokningsvillkor
- Fram till 40 dagar före avresa: 30 % av totalbeloppet
- Från 39 dagar före avresa: 100 % av totalbeloppet
- Bokningsavgiften är alltid ej återbetalningsbar.

## Överlåtelse
Bokningen kan överlåtas till annan person senast 7 dagar innan avresa mot en administrativ avgift.

## Ändringar och inställningar
Vid väsentliga ändringar (ändrat datum, destination, prishöjning över 8 %) erbjuds alternativ resa eller full återbetalning. Resan kan ställas in vid för få deltagare med förvarning enligt lag.

## Resenärens ansvar
Resenären ansvarar för giltigt pass, visum (om tillämpligt) och reseförsäkring. Störande beteende kan leda till avvisning utan återbetalning.

## Riktlinjer
- Svara alltid på svenska
- Var vänlig, professionell och hjälpsam
- Om du inte kan svara på en fråga, hänvisa till info@studentresor.se eller telefon 042-424 04 71
- Håll svaren koncisa men informativa
- Hänvisa till sidan /resevillkor för fullständiga allmänna resevillkor
- Hänvisa till /faq för fler vanliga frågor
- Uppmuntra besökare att boka via hemsidan`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Vänta lite och försök igen. Vi har för många förfrågningar just nu." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI-tjänsten är tillfälligt otillgänglig. Kontakta oss direkt istället." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Ett fel uppstod. Försök igen senare." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
