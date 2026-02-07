import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, school, date, time, meetLink } = await req.json();
    console.log("Sending meeting confirmation to:", email);

    if (!email || !firstName || !date || !time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meetLinkHtml = meetLink
      ? `<p style="margin: 20px 0;"><a href="${meetLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Öppna Google Meet</a></p>`
      : `<p style="color: #666;">Vi skickar en länk till videosamtalet separat.</p>`;

    // Send to the visitor
    const visitorEmail = await resend.emails.send({
      from: "Studentresor <noreply@kontakt.studentresor.com>",
      to: [email],
      subject: `Bekräftelse: Videosamtal ${date}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Ditt videosamtal är bokat!</h1>
          <p>Hej ${firstName},</p>
          <p>Tack för att du bokat ett videosamtal med oss. Här är detaljerna:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Datum:</strong> ${date}</p>
            <p><strong>Tid:</strong> ${time}</p>
            <p><strong>Skola:</strong> ${school}</p>
          </div>
          ${meetLinkHtml}
          <p>Vi ser fram emot att prata med er!</p>
          <p>Med vänliga hälsningar,<br/>Studentresor</p>
        </div>
      `,
    });

    console.log("Visitor email sent:", visitorEmail);

    // Notify admin
    const adminEmail = await resend.emails.send({
      from: "Studentresor <noreply@kontakt.studentresor.com>",
      to: ["info@studentresor.com"],
      subject: `Ny mötesbokning: ${firstName} ${lastName} (${school})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Ny mötesbokning</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Namn:</strong> ${firstName} ${lastName}</p>
            <p><strong>E-post:</strong> ${email}</p>
            <p><strong>Skola:</strong> ${school}</p>
            <p><strong>Datum:</strong> ${date}</p>
            <p><strong>Tid:</strong> ${time}</p>
          </div>
          ${meetLink ? `<p><a href="${meetLink}">Google Meet-länk</a></p>` : ""}
        </div>
      `,
    });

    console.log("Admin email sent:", adminEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending meeting confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
