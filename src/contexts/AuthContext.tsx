import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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

const AUTH_STORAGE_KEY_SUFFIX = "-auth-token";

const clearStoredAuthState = () => {
  if (typeof window === "undefined") return;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const exactKeys = new Set(
    [
      projectId ? `sb-${projectId}${AUTH_STORAGE_KEY_SUFFIX}` : "",
      "supabase.auth.token",
    ].filter(Boolean)
  );

  const clearFromStorage = (storage: Storage) => {
    Object.keys(storage)
      .filter(
        (key) =>
          exactKeys.has(key) ||
          (key.startsWith("sb-") && key.endsWith(AUTH_STORAGE_KEY_SUFFIX))
      )
      .forEach((key) => storage.removeItem(key));
  };

  clearFromStorage(window.localStorage);
  clearFromStorage(window.sessionStorage);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
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
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    let error: any = null;

    try {
      const globalSignOut = await supabase.auth.signOut();
      error = globalSignOut.error;

      if (error) {
        const localSignOut = await supabase.auth.signOut({ scope: "local" });
        error = localSignOut.error ?? error;
      }
    } finally {
      clearStoredAuthState();
      setSession(null);
      setUser(null);
    }

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
