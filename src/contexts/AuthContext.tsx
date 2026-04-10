import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: "admin" | "colaborador" | "cliente";
  colaborador_type: "gestor" | "designer" | "cs" | null;
  active: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, fullName: string, role: "admin" | "colaborador" | "cliente", colaboradorType?: "gestor" | "designer" | "cs") => Promise<{ error: Error | null; data: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as Profile);
  };

  // Reset demo data whenever demo user session is detected (with dedup guard)
  const demoResetInFlight = { current: false };
  const resetDemoData = async (email: string) => {
    if (email === "modelo@zaytan.com" && !demoResetInFlight.current) {
      demoResetInFlight.current = true;
      try {
        await supabase.functions.invoke("seed-demo");
      } catch (_) {
        // silently ignore
      } finally {
        demoResetInFlight.current = false;
      }
    }
  };

  useEffect(() => {
    let initialLoad = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
          // Only reset demo on auth state change, not on initial load (handled by getSession)
          if (!initialLoad) {
            resetDemoData(session.user.email || "");
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        resetDemoData(session.user.email || "");
      }
      setLoading(false);
      initialLoad = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const createUser = async (
    email: string,
    password: string,
    fullName: string,
    role: "admin" | "colaborador" | "cliente",
    colaboradorType?: "gestor" | "designer" | "cs"
  ) => {
    // Admin creates users via edge function
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email, password, full_name: fullName, role, colaborador_type: colaboradorType },
    });
    return { error: error as Error | null, data };
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut, createUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
