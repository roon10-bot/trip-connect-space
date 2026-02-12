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

        // Create user account via invite
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          traveler.email,
          {
            data: {
              full_name: `${traveler.firstName} ${traveler.lastName}`,
              phone: traveler.phone,
            },
            redirectTo: `${siteUrl}/auth`,
          }
        );

        if (inviteError) {
          console.error(`Error inviting ${traveler.email}:`, inviteError);
          results.push({ email: traveler.email, status: "error", error: inviteError.message });
          continue;
        }

        // Create profile for the new user
        if (inviteData?.user) {
          await supabaseAdmin.from("profiles").insert({
            user_id: inviteData.user.id,
            full_name: `${traveler.firstName} ${traveler.lastName}`,
            phone: traveler.phone,
          });

          // Update trip_booking_travelers with the new user's ID if needed
          console.log(`Created account for ${traveler.email}, user id: ${inviteData.user.id}`);
        }

        // Send custom booking notification email via Resend
        await resend.emails.send({
          from: "Studentresor <noreply@kontakt.studentresor.com>",
          to: [traveler.email],
          subject: `Du är bokad på ${tripName}! Aktivera ditt konto`,
          html: buildInviteEmail(traveler, tripName, tripType, departureDate, returnDate, siteUrl),
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
  siteUrl: string
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
      <p>Ett konto har skapats åt dig. Klicka på knappen nedan för att aktivera ditt konto och sätta ditt lösenord:</p>
      <p style="text-align: center; margin: 30px 0;">
        <em style="color: #666;">Du har fått ett separat mejl från oss med en aktiveringslänk. Klicka på den för att sätta ditt lösenord.</em>
      </p>
      <p>När du har aktiverat ditt konto kan du logga in på <a href="${siteUrl}" style="color: #0c4a6e;">${siteUrl}</a> för att se all information om din resa.</p>
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
