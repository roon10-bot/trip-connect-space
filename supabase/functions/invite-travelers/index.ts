import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TravelerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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

function generateTempPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function replacePlaceholders(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function buildEmailHtml(template: EmailTemplate, vars: Record<string, string>, actionUrl?: string): string {
  const color = template.primary_color || "#0c4a6e";
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
        <p style="color: #666; font-size: 14px;">Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:<br/>
        <a href="${actionUrl}" style="color: ${color}; word-break: break-all;">${actionUrl}</a></p>
      ` : ""}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">${footer.replace(/\n/g, "<br/>")}</p>
    </div>
  `;
}

// Default template used if DB fetch fails
const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: "Välkommen till Studentresor – Aktivera ditt konto",
  heading: "Välkommen till Studentresor!",
  body_text: "Du har blivit tillagd som resenär på resan {{trip_name}} ({{trip_type}}), {{departure_date}} – {{return_date}}. Klicka på knappen nedan för att aktivera ditt konto och se dina resedokument.",
  button_text: "Aktivera mitt konto",
  footer_text: "Om du inte förväntar dig detta mail kan du ignorera det.",
  primary_color: "#0c4a6e",
  logo_url: null,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { travelers, tripName, tripType, departureDate, returnDate, bookingId, bookerEmail, siteUrl } = await req.json();

    console.log("Inviting travelers for booking:", bookingId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch email template from DB
    let template = DEFAULT_TEMPLATE;
    try {
      const { data: tplData } = await supabaseAdmin
        .from("email_templates")
        .select("subject, heading, body_text, button_text, footer_text, primary_color, logo_url")
        .eq("template_key", "invite_traveler")
        .maybeSingle();
      if (tplData) template = tplData as EmailTemplate;
    } catch (e) {
      console.error("Failed to fetch email template, using default:", e);
    }

    const templateVars = {
      trip_name: tripName,
      trip_type: tripType,
      departure_date: departureDate,
      return_date: returnDate,
      site_url: siteUrl,
      first_name: "", // set per traveler
    };

    const results: { email: string; status: string; error?: string }[] = [];

    for (const traveler of travelers as TravelerData[]) {
      // Skip the main booker - they already have an account
      if (traveler.email.toLowerCase() === bookerEmail.toLowerCase()) {
        results.push({ email: traveler.email, status: "skipped_booker" });
        continue;
      }

      const vars = { ...templateVars, first_name: traveler.firstName };

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email?.toLowerCase() === traveler.email.toLowerCase()
        );

        if (existingUser) {
          console.log(`User ${traveler.email} already exists, sending info email`);

          await resend.emails.send({
            from: "Studentresor <noreply@kontakt.studentresor.com>",
            to: [traveler.email],
            subject: replacePlaceholders(template.subject, vars),
            html: buildEmailHtml(template, vars, `${siteUrl}/dashboard`),
          });

          results.push({ email: traveler.email, status: "existing_user_notified" });
          continue;
        }

        // Create user with a temporary password
        const tempPassword = generateTempPassword();
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: traveler.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: `${traveler.firstName} ${traveler.lastName}`,
            phone: traveler.phone,
          },
        });

        if (createError) {
          console.error(`Error creating user ${traveler.email}:`, createError);
          results.push({ email: traveler.email, status: "error", error: createError.message });
          continue;
        }

        // Create profile for the new user
        if (createData?.user) {
          await supabaseAdmin.from("profiles").insert({
            user_id: createData.user.id,
            full_name: `${traveler.firstName} ${traveler.lastName}`,
            phone: traveler.phone,
          });
          console.log(`Created account for ${traveler.email}, user id: ${createData.user.id}`);
        }

        // Generate a magic link for the user to set their password
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: traveler.email,
          options: {
            redirectTo: `${siteUrl}/auth`,
          },
        });

        if (linkError) {
          console.error(`Error generating magic link for ${traveler.email}:`, linkError);
          await resend.emails.send({
            from: "Studentresor <noreply@kontakt.studentresor.com>",
            to: [traveler.email],
            subject: replacePlaceholders(template.subject, vars),
            html: buildEmailHtml(template, vars, `${siteUrl}/auth`),
          });
          results.push({ email: traveler.email, status: "created_no_magic_link" });
          continue;
        }

        const magicLinkUrl = linkData.properties.action_link;

        await resend.emails.send({
          from: "Studentresor <noreply@kontakt.studentresor.com>",
          to: [traveler.email],
          subject: replacePlaceholders(template.subject, vars),
          html: buildEmailHtml(template, vars, magicLinkUrl),
        });

        results.push({ email: traveler.email, status: "invited" });
      } catch (travelerError) {
        console.error(`Error processing traveler ${traveler.email}:`, travelerError);
        results.push({ email: traveler.email, status: "error", error: String(travelerError) });
      }
    }

    // Also notify admin about the booking
    await resend.emails.send({
      from: "Studentresor <noreply@kontakt.studentresor.com>",
      to: ["info@studentresor.com"],
      subject: `Ny bokning: ${tripName} (${(travelers as TravelerData[]).length} resenärer)`,
      html: buildAdminEmail(travelers as TravelerData[], tripName, tripType, departureDate, returnDate, bookingId, bookerEmail),
    });

    console.log("Invite results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in invite-travelers:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildAdminEmail(
  travelers: TravelerData[],
  tripName: string,
  tripType: string,
  departureDate: string,
  returnDate: string,
  bookingId: string,
  bookerEmail: string
): string {
  const travelerList = travelers
    .map((t) => `<li>${t.firstName} ${t.lastName} (${t.email})</li>`)
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1a1a2e;">Ny bokning</h1>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Resa:</strong> ${tripName}</p>
        <p><strong>Datum:</strong> ${departureDate} – ${returnDate}</p>
        <p><strong>Huvudbokare:</strong> ${bookerEmail}</p>
        <p><strong>Antal resenärer:</strong> ${travelers.length}</p>
      </div>
      <h3>Resenärer:</h3>
      <ul>${travelerList}</ul>
    </div>
  `;
}
