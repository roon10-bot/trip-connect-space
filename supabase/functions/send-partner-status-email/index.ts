import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PORTAL_BASE = Deno.env.get("PARTNER_PORTAL_URL") ?? "https://studentresor-flights.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, first_name, last_name, status } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status !== "approved" && status !== "rejected") {
      return new Response(JSON.stringify({ ok: false, error: "status must be approved or rejected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const name = `${first_name || ""} ${last_name || ""}`.trim() || email;
    const portalUrl = `${PORTAL_BASE.replace(/\/$/, "")}/partner`;
    const loginUrl = `${PORTAL_BASE.replace(/\/$/, "")}/auth/login`;

    const sendTransactional = async (payload: Record<string, unknown>) => {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("send-transactional-email failed", res.status, text);
      }
      return res;
    };

    if (status === "approved") {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: portalUrl },
      });

      const magicLink = linkData?.properties?.action_link ?? loginUrl;

      await sendTransactional({
        template_key: "partner_application_approved",
        to_email: email,
        to_name: name,
        variables: {
          first_name: first_name || name,
          magic_link: magicLink,
          portal_url: portalUrl,
          button_url: magicLink,
        },
      });
    }

    if (status === "rejected") {
      await sendTransactional({
        template_key: "partner_application_rejected",
        to_email: email,
        to_name: name,
        variables: {
          first_name: first_name || name,
          contact_email: "igor@studentresor.se",
          button_url: "mailto:igor@studentresor.se",
        },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-partner-status-email", e);
    const message = e instanceof Error ? e.message : "Internal error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
