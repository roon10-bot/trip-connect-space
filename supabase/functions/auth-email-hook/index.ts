import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const POSTMARK_API = "https://api.postmarkapp.com/email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map Supabase auth email types to our template keys
const AUTH_TYPE_TO_TEMPLATE: Record<string, string> = {
  signup: "auth_signup",
  recovery: "auth_recovery",
  magiclink: "auth_magiclink",
  invite: "auth_invite",
  email_change: "auth_email_change",
};

interface EmailTemplate {
  subject: string;
  heading: string;
  body_text: string;
  button_text: string;
  footer_text: string;
  primary_color: string;
  logo_url: string | null;
  is_active: boolean;
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

function buildEmailHtml(template: EmailTemplate, vars: Record<string, string>, actionUrl?: string): string {
  const color = template.primary_color || "#0C4D73";
  const heading = replacePlaceholders(template.heading, vars);
  const body = replacePlaceholders(template.body_text, vars);
  const buttonText = replacePlaceholders(template.button_text, vars);
  const footer = replacePlaceholders(template.footer_text, vars);

  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:${color};padding:32px 40px;text-align:center;">
              ${template.logo_url ? `<img src="${template.logo_url}" alt="Studentresor" height="32" style="display:inline-block;" />` : `<span style="color:#ffffff;font-size:20px;font-weight:700;">Studentresor</span>`}
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#1a1a1a;">${heading}</h1>
              <div style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#4a4a4a;">${body.replace(/\\n/g, "<br/>").replace(/\n/g, "<br/>")}</div>
            </td>
          </tr>
          ${actionUrl && buttonText ? `
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <a href="${actionUrl}" target="_blank" style="display:inline-block;background-color:${color};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
                ${buttonText}
              </a>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e8e8e8;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.5;">${footer.replace(/\\n/g, "<br/>").replace(/\n/g, "<br/>")}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN");
    if (!postmarkToken) throw new Error("POSTMARK_SERVER_TOKEN is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("[AUTH-EMAIL-HOOK] Received payload type:", payload.type);

    // Supabase Auth Hook payload
    const emailType = payload.type; // signup, recovery, magiclink, invite, email_change
    const recipientEmail = payload.user?.email;
    const confirmationUrl = payload.email_data?.confirmation_url || payload.email_data?.action_link;
    const token = payload.email_data?.token;
    const tokenHash = payload.email_data?.token_hash;
    const redirectTo = payload.email_data?.redirect_to;

    if (!recipientEmail || !emailType) {
      console.error("[AUTH-EMAIL-HOOK] Missing email or type in payload");
      return new Response(JSON.stringify({ error: "Missing email or type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateKey = AUTH_TYPE_TO_TEMPLATE[emailType];
    if (!templateKey) {
      console.log(`[AUTH-EMAIL-HOOK] No template mapping for type: ${emailType}, skipping`);
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template from database
    const { data: tplData, error: tplError } = await supabaseAdmin
      .from("email_templates")
      .select("subject, heading, body_text, button_text, footer_text, primary_color, logo_url, is_active")
      .eq("template_key", templateKey)
      .maybeSingle();

    if (tplError || !tplData) {
      console.error(`[AUTH-EMAIL-HOOK] Template '${templateKey}' not found, falling back`);
      // Return empty response to let Supabase send default email
      return new Response(JSON.stringify({ skipped: true, reason: "template_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tplData.is_active) {
      console.log(`[AUTH-EMAIL-HOOK] Template '${templateKey}' is disabled`);
      return new Response(JSON.stringify({ skipped: true, reason: "template_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = tplData as EmailTemplate;
    const vars: Record<string, string> = {
      email: recipientEmail,
      confirmation_url: confirmationUrl || "",
      token: token || "",
      site_url: "https://studentresor.com",
    };

    const subject = replacePlaceholders(template.subject, vars);
    const html = buildEmailHtml(template, vars, confirmationUrl);

    // Send via Postmark
    const res = await fetch(POSTMARK_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify({
        From: "Studentresor <noreply@studentresor.com>",
        To: recipientEmail,
        Subject: subject,
        HtmlBody: html,
        TextBody: stripHtml(html),
      }),
    });

    const data = await res.json();
    if (!res.ok || data.ErrorCode) {
      console.error("[AUTH-EMAIL-HOOK] Postmark error:", data);
      throw new Error(`Failed to send: ${data.Message || JSON.stringify(data)}`);
    }

    console.log(`[AUTH-EMAIL-HOOK] Sent ${emailType} email to ${recipientEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AUTH-EMAIL-HOOK] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
