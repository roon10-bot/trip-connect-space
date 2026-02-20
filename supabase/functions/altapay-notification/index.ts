import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log("[ALTAPAY-NOTIFICATION] Received:", body.substring(0, 1000));
    // TODO: Parse XML and update payment status in DB
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[ALTAPAY-NOTIFICATION] Error:", error);
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
