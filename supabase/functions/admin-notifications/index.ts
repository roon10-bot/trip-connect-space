import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@studentresor.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    let subject = "";
    let htmlBody = "";

    if (type === "partner_registered") {
      const name =
        data.partner_type === "individual"
          ? `${data.first_name} ${data.last_name}`
          : data.company_name;
      const partnerType =
        data.partner_type === "individual" ? "Privatperson" : "Företag";

      subject = `Ny värdansökan: ${name}`;
      htmlBody = `
        <h2>Ny värdansökan att granska</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Namn</td><td style="padding:6px 12px;">${name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Typ</td><td style="padding:6px 12px;">${partnerType}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">E-post</td><td style="padding:6px 12px;">${data.email}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Telefon</td><td style="padding:6px 12px;">${data.phone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Land</td><td style="padding:6px 12px;">${data.country}</td></tr>
        </table>
        <br/>
        <p>Logga in i kontrollcentret för att granska och godkänna ansökan.</p>
      `;
    } else if (type === "listing_created") {
      subject = `Nytt boende att granska: ${data.name}`;
      htmlBody = `
        <h2>Nytt boende att granska</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Boende</td><td style="padding:6px 12px;">${data.name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Destination</td><td style="padding:6px 12px;">${data.destination}, ${data.country}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Kapacitet</td><td style="padding:6px 12px;">${data.capacity} gäster</td></tr>
          ${data.rooms ? `<tr><td style="padding:6px 12px;font-weight:bold;">Rum</td><td style="padding:6px 12px;">${data.rooms}</td></tr>` : ""}
          ${data.partner_name ? `<tr><td style="padding:6px 12px;font-weight:bold;">Värd</td><td style="padding:6px 12px;">${data.partner_name}</td></tr>` : ""}
        </table>
        <br/>
        <p>Logga in i kontrollcentret för att granska och godkänna boendet.</p>
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown notification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN");
    if (!POSTMARK_SERVER_TOKEN) {
      throw new Error("POSTMARK_SERVER_TOKEN not configured");
    }

    // Generate plain text from HTML
    const textBody = htmlBody
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?(h[1-6]|p|tr|table)[^>]*>/gi, "\n")
      .replace(/<\/?(td)[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        From: "noreply@studentresor.com",
        To: ADMIN_EMAIL,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Postmark error:", errorText);
      throw new Error(`Postmark error: ${res.status}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
