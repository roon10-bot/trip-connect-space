import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const POSTMARK_API = "https://api.postmarkapp.com/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailTemplate {
  subject: string;
  heading: string;
  body_text: string;
  button_text: string;
  footer_text: string;
  primary_color: string;
  logo_url: string | null;
}

function replacePlaceholders(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function buildEmailHtml(template: EmailTemplate, vars: Record<string, string>, actionUrl?: string): string {
  const color = template.primary_color || "#1a73e8";
  const heading = replacePlaceholders(template.heading, vars);
  const body = replacePlaceholders(template.body_text, vars);
  const buttonText = replacePlaceholders(template.button_text, vars);
  const footer = replacePlaceholders(template.footer_text, vars);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      ${template.logo_url ? `<img src="${template.logo_url}" alt="Logo" style="max-height: 48px; margin-bottom: 16px;" />` : ""}
      <h1 style="color: ${color};">${heading}</h1>
      <p>${body.replace(/\n/g, "<br/>")}</p>
      ${actionUrl && buttonText ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" style="background: ${color}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            ${buttonText}
          </a>
        </p>
      ` : ""}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">${footer.replace(/\n/g, "<br/>")}</p>
    </div>
  `;
}

async function sendPostmark(token: string, payload: {
  From: string;
  To: string;
  Subject: string;
  HtmlBody: string;
}) {
  const res = await fetch(POSTMARK_API, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.ErrorCode) {
    throw new Error(data.Message || `Postmark error ${data.ErrorCode}`);
  }
  return data;
}

const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: "Bekräftelse: Videosamtal {{date}}",
  heading: "Mötesbekräftelse",
  body_text: "Hej {{first_name}}, ditt möte är bokat den {{date}} kl. {{time}}. Vi ser fram emot att prata med dig!",
  button_text: "Öppna mötet",
  footer_text: "Har du frågor? Kontakta oss på info@studentresor.com",
  primary_color: "#1a73e8",
  logo_url: null,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("POSTMARK_SERVER_TOKEN");
    if (!token) throw new Error("POSTMARK_SERVER_TOKEN is not set");

    const { firstName, lastName, email, school, date, time, meetLink } = await req.json();
    console.log("Sending meeting confirmation to:", email);

    if (!email || !firstName || !date || !time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let template = DEFAULT_TEMPLATE;
    try {
      const { data: tplData } = await supabaseAdmin
        .from("email_templates")
        .select("subject, heading, body_text, button_text, footer_text, primary_color, logo_url")
        .eq("template_key", "meeting_confirmation")
        .maybeSingle();
      if (tplData) template = tplData as EmailTemplate;
    } catch (e) {
      console.error("Failed to fetch email template, using default:", e);
    }

    const vars = {
      first_name: firstName,
      name: `${firstName} ${lastName}`,
      date,
      time,
      school: school || "",
    };

    // Send to the visitor
    const visitorResult = await sendPostmark(token, {
From: "Studentresor <noreply@studentresor.com>",
      To: email,
      Subject: replacePlaceholders(template.subject, vars),
      HtmlBody: buildEmailHtml(template, vars, meetLink || undefined),
    });
    console.log("Visitor email sent:", visitorResult);

    // Notify admin
    const adminResult = await sendPostmark(token, {
From: "Studentresor <noreply@studentresor.com>",
      To: "info@studentresor.com",
      Subject: `Ny mötesbokning: ${firstName} ${lastName} (${school})`,
      HtmlBody: `
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
    console.log("Admin email sent:", adminResult);

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
