import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Send welcome email once after email verification */
const sendWelcomeEmailIfNeeded = async (user: User) => {
  // Only proceed if the user's email is confirmed
  if (!user.email_confirmed_at) return;

  try {
    // Check if welcome email was already sent
    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_email_sent, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.welcome_email_sent) return;

    // Mark as sent first to prevent duplicates
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to mark welcome email as sent:", updateError);
      return;
    }

    // Send welcome email
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        template_key: "welcome",
        to_email: user.email,
        variables: {
          first_name: profile.full_name?.split(" ")[0] || "",
        },
        action_url: "https://studentresor.com/destinations",
      },
    });
  } catch (e) {
    console.error("Failed to send welcome email:", e);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const welcomeCheckDone = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Check for welcome email after sign-in (deferred to avoid blocking auth)
        const currentUser = currentSession?.user;
        if (currentUser?.email_confirmed_at && welcomeCheckDone.current !== currentUser.id) {
          welcomeCheckDone.current = currentUser.id;
          setTimeout(() => sendWelcomeEmailIfNeeded(currentUser), 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { data, error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
