import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const color = template.primary_color || "#0c4a6e";
  const heading = replacePlaceholders(template.heading, vars);
  const body = replacePlaceholders(template.body_text, vars);
  const buttonText = replacePlaceholders(template.button_text, vars);
  const footer = replacePlaceholders(template.footer_text, vars);

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          ${template.logo_url ? `<img src="${template.logo_url}" alt="Studentresor" style="max-height: 48px; margin-bottom: 24px;" />` : ""}
          <h1 style="color: ${color}; font-size: 24px; margin: 0 0 20px 0;">${heading}</h1>
          <div style="color: #333; font-size: 16px; line-height: 1.6;">${body.replace(/\\n/g, "<br/>").replace(/\n/g, "<br/>")}</div>
          ${actionUrl && buttonText ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="background: ${color}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                ${buttonText}
              </a>
            </p>
          ` : ""}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #999; font-size: 13px; line-height: 1.5;">${footer.replace(/\\n/g, "<br/>").replace(/\n/g, "<br/>")}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("POSTMARK_SERVER_TOKEN");
    if (!token) throw new Error("POSTMARK_SERVER_TOKEN is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { template_key, to_email, variables, action_url, subject_override, body_override } = await req.json();

    if (!template_key || !to_email) {
      return new Response(JSON.stringify({ error: "template_key and to_email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[SEND-EMAIL] Sending ${template_key} to ${to_email}`);

    // Server-side idempotency check for welcome emails
    // Uses DB function get_user_id_by_email to look up the user without auth.admin.getUserByEmail
    if (template_key === "welcome") {
      const { data: userId } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: to_email });

      if (userId) {
        const { data: profileData } = await supabaseAdmin
          .from("profiles")
          .select("welcome_email_sent")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileData?.welcome_email_sent) {
          console.log(`[SEND-EMAIL] Welcome email already sent to ${to_email}, skipping`);
          return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: tplData, error: tplError } = await supabaseAdmin
      .from("email_templates")
      .select("subject, heading, body_text, button_text, footer_text, primary_color, logo_url, is_active")
      .eq("template_key", template_key)
      .maybeSingle();

    if (tplError || !tplData) {
      console.error("[SEND-EMAIL] Template not found:", template_key, tplError);
      return new Response(JSON.stringify({ error: `Template '${template_key}' not found` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tplData.is_active) {
      console.log(`[SEND-EMAIL] Template '${template_key}' is disabled, skipping`);
      return new Response(JSON.stringify({ skipped: true, reason: "template_disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const template = tplData as EmailTemplate;
    const vars = variables || {};

    // Allow admin overrides for subject and body
    if (subject_override) template.subject = subject_override;
    if (body_override) template.body_text = body_override;

    const subject = replacePlaceholders(template.subject, vars);
    const html = buildEmailHtml(template, vars, action_url);

    const res = await fetch(POSTMARK_API, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: "Studentresor <noreply@studentresor.com>",
        To: to_email,
        Subject: subject,
        HtmlBody: html,
        TextBody: stripHtml(html),
      }),
    });

    const data = await res.json();
    if (!res.ok || data.ErrorCode) {
      console.error("[SEND-EMAIL] Postmark error:", data);
      throw new Error(`Failed to send email: ${data.Message || JSON.stringify(data)}`);
    }

    console.log(`[SEND-EMAIL] Successfully sent ${template_key} to ${to_email}`);

    // Mark welcome email as sent in profiles table
    if (template_key === "welcome") {
      const { data: userId } = await supabaseAdmin.rpc("get_user_id_by_email", { p_email: to_email });
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ welcome_email_sent: true })
          .eq("user_id", userId);
        console.log(`[SEND-EMAIL] Marked welcome_email_sent=true for ${to_email}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[SEND-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
