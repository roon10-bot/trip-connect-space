import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const POSTMARK_API = "https://api.postmarkapp.com/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildEmailHtml(template: EmailTemplate, vars: Record<string, string>): string {
  const color = template.primary_color || "#0c4a6e";
  const heading = replacePlaceholders(template.heading, vars);
  const body = replacePlaceholders(template.body_text, vars);
  const footer = replacePlaceholders(template.footer_text, vars);

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      ${template.logo_url ? `<img src="${template.logo_url}" alt="Logo" style="max-height: 48px; margin-bottom: 16px;" />` : ""}
      <h1 style="color: ${color};">${heading}</h1>
      <p>${body.replace(/\n/g, "<br/>")}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">${footer.replace(/\n/g, "<br/>")}</p>
    </div>
  `;
}

async function sendPostmark(token: string, payload: {
  From: string;
  To: string;
  ReplyTo?: string;
  Subject: string;
  HtmlBody: string;
  TextBody?: string;
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("POSTMARK_SERVER_TOKEN");
    if (!token) throw new Error("POSTMARK_SERVER_TOKEN is not set");

    const { firstName, lastName, email, subject, message }: ContactRequest = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      throw new Error("Alla fält måste fyllas i");
    }

    console.log(`Processing contact form submission`);

    // Send the contact form to admin
    const adminHtml = `
        <h2>Nytt meddelande från kontaktformuläret</h2>
        <p><strong>Namn:</strong> ${firstName} ${lastName}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Ämne:</strong> ${subject}</p>
        <hr />
        <p><strong>Meddelande:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `;
    const data = await sendPostmark(token, {
      From: "Studentresor Kontakt <noreply@studentresor.com>",
      To: "info@studentresor.com",
      ReplyTo: email,
      Subject: `Kontaktformulär: ${subject}`,
      HtmlBody: adminHtml,
      TextBody: stripHtml(adminHtml),
    });

    console.log("Contact email sent successfully");

    // Send confirmation email to the user using template
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: tplData } = await supabaseAdmin
        .from("email_templates")
        .select("subject, heading, body_text, button_text, footer_text, primary_color, logo_url")
        .eq("template_key", "contact_confirmation")
        .maybeSingle();

      if (tplData) {
        const vars = {
          first_name: firstName,
          name: `${firstName} ${lastName}`,
          subject,
        };

        const confirmHtml = buildEmailHtml(tplData as EmailTemplate, vars);
        await sendPostmark(token, {
          From: "Studentresor <noreply@studentresor.com>",
          To: email,
          Subject: replacePlaceholders((tplData as EmailTemplate).subject, vars),
          HtmlBody: confirmHtml,
          TextBody: stripHtml(confirmHtml),
        });
        console.log("Confirmation email sent");
      }
    } catch (confirmError) {
      console.error("Failed to send confirmation email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email");
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
