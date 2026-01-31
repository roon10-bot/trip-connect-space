import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Du är Studentresors hjälpsamma AI-assistent. Du hjälper kunder med frågor om resor, bokningar och praktisk information.

## Om Studentresor
Studentresor arrangerar resor för studenter med fokus på tre huvudresor:
- **Segelveckan** - En seglingsresa i Kroatien
- **Studentveckan** - Studentresa med fokus på upplevelser
- **Splitveckan** - Resa till Split, Kroatien

## Vad du kan hjälpa med
- Svara på frågor om våra resor och destinationer
- Förklara bokningsprocessen och betalningsalternativ
- Ge information om avresedatum, priser och vad som ingår
- Besvara vanliga frågor (FAQ)
- Hjälpa med kontaktinformation

## Betalningsinformation
- Resor betalas i delbetalningar
- Första delbetalningen vid bokning
- Andra delbetalningen några månader före avresa
- Slutbetalning närmare avresa

## Riktlinjer
- Svara alltid på svenska
- Var vänlig, professionell och hjälpsam
- Om du inte kan svara på en fråga, hänvisa till kontakt@studentresor.se
- Håll svaren koncisa men informativa
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
