import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmailIfNeeded } from "@/lib/welcomeEmail";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const welcomeCheckDone = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Reset welcome check on sign-out so it re-runs on next sign-in
        if (event === "SIGNED_OUT") {
          welcomeCheckDone.current = null;
          return;
        }

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
    const redirectUrl = `${window.location.origin}/auth?verified=1`;

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

    const currentUser = data.user;
    if (!error && currentUser?.email_confirmed_at && welcomeCheckDone.current !== currentUser.id) {
      welcomeCheckDone.current = currentUser.id;
      setTimeout(() => sendWelcomeEmailIfNeeded(currentUser), 0);
    }

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
