import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PORTAL_BASE = "https://studentresor-flights.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const email = payload.user?.email;
    const tokenHash = payload.email_data?.token_hash;
    const type = payload.email_data?.email_action_type;
    const redirectTo = payload.email_data?.redirect_to || "";
    const suppressEmail = payload.user?.user_metadata?.suppress_confirmation_email;

    console.log("auth-email-hook payload type:", type, "email:", email);

    // Suppress confirmation email for hosts
    if (type === "signup" && suppressEmail === true) {
      console.log("Suppressing confirmation email for host:", email);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build next param from redirect_to
    let next = "/";
    if (redirectTo.includes("/auth/callback?next=")) {
      const inner = new URL(redirectTo).searchParams.get("next");
      if (inner) next = decodeURIComponent(inner);
    } else if (redirectTo.includes(PORTAL_BASE)) {
      const u = new URL(redirectTo);
      next = u.pathname + u.search;
    }

    // Build action URL using token_hash for SSR-compatible flow
    let actionUrl = "";
    if (tokenHash && type) {
      const confirmUrl = new URL(`${PORTAL_BASE}/auth/confirm`);
      confirmUrl.searchParams.set("token_hash", tokenHash);
      confirmUrl.searchParams.set("type", type === "signup" ? "email" : type);
      if (next && next !== "/") confirmUrl.searchParams.set("next", next);
      actionUrl = confirmUrl.toString();
    }

    console.log("action_url:", actionUrl);

    // Map type to template key
    const templateMap: Record<string, string> = {
      signup: "auth_signup",
      recovery: "auth_recovery",
      magiclink: "auth_magiclink",
      invite: "auth_invite",
      email_change: "auth_email_change",
    };
    const templateKey = templateMap[type] || "auth_signup";

    // Send via send-transactional-email
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        template_key: templateKey,
        to_email: email,
        to_name: email,
        action_url: actionUrl,
        variables: {
          button_url: actionUrl,
          action_url: actionUrl,
          confirm_url: actionUrl,
        },
      },
    });

    if (error) {
      console.error("send-transactional-email error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("auth-email-hook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
