import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET" && action === "list") {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (listError) {
        throw listError;
      }

      // Fetch all admin roles
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));

      const users = usersData.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: u.user_metadata?.full_name || null,
        email_confirmed: !!u.email_confirmed_at,
        is_admin: adminUserIds.has(u.id),
      }));

      return new Response(JSON.stringify({ users }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "toggle-admin") {
      const { userId } = await req.json();

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot change your own admin role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        // Remove admin role
        await supabaseAdmin.from("user_roles").delete().eq("id", existingRole.id);
        return new Response(JSON.stringify({ success: true, isAdmin: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Add admin role
        await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
        return new Response(JSON.stringify({ success: true, isAdmin: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "POST" && action === "delete") {
      const { userId } = await req.json();

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Don't allow deleting yourself
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete all related data first to avoid foreign key constraints
      // 1. Get trip bookings for this user
      const { data: tripBookings } = await supabaseAdmin
        .from("trip_bookings")
        .select("id")
        .eq("user_id", userId);

      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map((b) => b.id);
        // Delete payments linked to trip bookings
        await supabaseAdmin.from("payments").delete().in("trip_booking_id", bookingIds);
        // Delete travelers linked to trip bookings
        await supabaseAdmin.from("trip_booking_travelers").delete().in("trip_booking_id", bookingIds);
        // Delete trip bookings
        await supabaseAdmin.from("trip_bookings").delete().eq("user_id", userId);
      }

      // 2. Delete payments directly linked to user
      await supabaseAdmin.from("payments").delete().eq("user_id", userId);

      // 3. Get bookings for this user
      const { data: bookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("user_id", userId);

      if (bookings && bookings.length > 0) {
        const bookingIds = bookings.map((b) => b.id);
        await supabaseAdmin.from("booking_accommodations").delete().in("booking_id", bookingIds);
        await supabaseAdmin.from("booking_attachments").delete().in("booking_id", bookingIds);
        await supabaseAdmin.from("booking_flights").delete().in("booking_id", bookingIds);
        await supabaseAdmin.from("bookings").delete().eq("user_id", userId);
      }

      // 4. Delete profile and roles
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

      // 5. Delete the auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in manage-users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
