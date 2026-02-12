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

function generateTempPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

    const results: { email: string; status: string; error?: string }[] = [];

    for (const traveler of travelers as TravelerData[]) {
      // Skip the main booker - they already have an account
      if (traveler.email.toLowerCase() === bookerEmail.toLowerCase()) {
        results.push({ email: traveler.email, status: "skipped_booker" });
        continue;
      }

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email?.toLowerCase() === traveler.email.toLowerCase()
        );

        if (existingUser) {
          // User already exists, just send info email
          console.log(`User ${traveler.email} already exists, sending info email`);

          await resend.emails.send({
            from: "Studentresor <noreply@kontakt.studentresor.com>",
            to: [traveler.email],
            subject: `Du är bokad på ${tripName}!`,
            html: buildInfoEmail(traveler, tripName, tripType, departureDate, returnDate, siteUrl),
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
          // Still send email without magic link as fallback
          await resend.emails.send({
            from: "Studentresor <noreply@kontakt.studentresor.com>",
            to: [traveler.email],
            subject: `Du är bokad på ${tripName}! Aktivera ditt konto`,
            html: buildInviteEmailFallback(traveler, tripName, tripType, departureDate, returnDate, siteUrl),
          });
          results.push({ email: traveler.email, status: "created_no_magic_link" });
          continue;
        }

        // Build the magic link URL using the hashed_token
        const magicLinkUrl = `${siteUrl}/auth#access_token=${linkData.properties.hashed_token}&type=magiclink`;

        // Send ONE single email with everything included
        await resend.emails.send({
          from: "Studentresor <noreply@kontakt.studentresor.com>",
          to: [traveler.email],
          subject: `Du är bokad på ${tripName}! Aktivera ditt konto`,
          html: buildInviteEmail(traveler, tripName, tripType, departureDate, returnDate, siteUrl, magicLinkUrl),
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

function buildInviteEmail(
  traveler: TravelerData,
  tripName: string,
  tripType: string,
  departureDate: string,
  returnDate: string,
  siteUrl: string,
  magicLinkUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <h1 style="color: #0c4a6e;">Välkommen på resa med Studentresor!</h1>
      <p>Hej ${traveler.firstName},</p>
      <p>Du har blivit bokad på resan <strong>${tripName}</strong>. Här är detaljerna:</p>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0c4a6e;">
        <p style="margin: 8px 0;"><strong>Resa:</strong> ${tripName}</p>
        <p style="margin: 8px 0;"><strong>Datum:</strong> ${departureDate} – ${returnDate}</p>
      </div>
      <p>Ett konto har skapats åt dig. Klicka på knappen nedan för att aktivera ditt konto och välja ett lösenord:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${magicLinkUrl}" style="background: #0c4a6e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
          Aktivera mitt konto
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:<br/>
      <a href="${magicLinkUrl}" style="color: #0c4a6e; word-break: break-all;">${magicLinkUrl}</a></p>
      <p>När du har aktiverat ditt konto kan du logga in på <a href="${siteUrl}" style="color: #0c4a6e;">${siteUrl}</a> för att se all information om din resa.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">Med vänliga hälsningar,<br/>Studentresor</p>
    </div>
  `;
}

function buildInviteEmailFallback(
  traveler: TravelerData,
  tripName: string,
  tripType: string,
  departureDate: string,
  returnDate: string,
  siteUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <h1 style="color: #0c4a6e;">Välkommen på resa med Studentresor!</h1>
      <p>Hej ${traveler.firstName},</p>
      <p>Du har blivit bokad på resan <strong>${tripName}</strong>.</p>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0c4a6e;">
        <p style="margin: 8px 0;"><strong>Resa:</strong> ${tripName}</p>
        <p style="margin: 8px 0;"><strong>Datum:</strong> ${departureDate} – ${returnDate}</p>
      </div>
      <p>Ett konto har skapats åt dig. Gå till <a href="${siteUrl}/auth" style="color: #0c4a6e;">${siteUrl}/auth</a> och logga in med din e-post för att komma igång.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">Med vänliga hälsningar,<br/>Studentresor</p>
    </div>
  `;
}

function buildInfoEmail(
  traveler: TravelerData,
  tripName: string,
  tripType: string,
  departureDate: string,
  returnDate: string,
  siteUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
      <h1 style="color: #0c4a6e;">Du är bokad på ${tripName}!</h1>
      <p>Hej ${traveler.firstName},</p>
      <p>Du har blivit tillagd på resan <strong>${tripName}</strong>.</p>
      <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0c4a6e;">
        <p style="margin: 8px 0;"><strong>Resa:</strong> ${tripName}</p>
        <p style="margin: 8px 0;"><strong>Datum:</strong> ${departureDate} – ${returnDate}</p>
      </div>
      <p>Logga in på <a href="${siteUrl}" style="color: #0c4a6e;">${siteUrl}</a> för att se all information om din resa.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      <p style="color: #666; font-size: 14px;">Med vänliga hälsningar,<br/>Studentresor</p>
    </div>
  `;
}

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
