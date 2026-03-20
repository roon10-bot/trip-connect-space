import { type User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type WelcomeEmailUser = Pick<User, "id" | "email" | "email_confirmed_at">;

/** Send welcome email once after email verification */
export const sendWelcomeEmailIfNeeded = async (user: WelcomeEmailUser) => {
  if (!user.email_confirmed_at || !user.email) return;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_email_sent, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.welcome_email_sent) return;

    const { error: sendError } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        template_key: "welcome",
        to_email: user.email,
        variables: {
          first_name: profile.full_name?.split(" ")[0] || "",
        },
        action_url: "https://studentresor.com/destinations",
      },
    });

    if (sendError) {
      console.error("Failed to send welcome email:", sendError);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("user_id", user.id)
      .eq("welcome_email_sent", false);

    if (updateError) {
      console.error("Failed to mark welcome email as sent:", updateError);
    }
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
};