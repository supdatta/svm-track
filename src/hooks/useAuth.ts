import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type LocalUser = {
  id: string;
  email: string | null;
  user_metadata: { display_name?: string };
  isLocal: true;
};

type AppUser = User | LocalUser;

const LOCAL_AUTH_KEY = "svn-track-local-user";

const readLocalUser = (): LocalUser | null => {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
};

const writeLocalUser = (email: string, displayName?: string): LocalUser => {
  const localUser: LocalUser = {
    id: `local-${Date.now()}`,
    email,
    user_metadata: { display_name: displayName || email.split("@")[0] },
    isLocal: true,
  };
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localUser));
  return localUser;
};

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedLocal = readLocalUser();
    if (cachedLocal) {
      setUser(cachedLocal);
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        localStorage.removeItem(LOCAL_AUTH_KEY);
        setUser(session.user);
      } else if (!readLocalUser()) {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          localStorage.removeItem(LOCAL_AUTH_KEY);
          setUser(session.user);
        } else {
          setUser(readLocalUser());
        }
      })
      .catch(() => {
        setUser(readLocalUser());
      })
      .finally(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const signInWithFallback = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { mode: "cloud" as const };
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes("Failed to fetch") || error?.name === "TypeError") {
        const localUser = writeLocalUser(email);
        setUser(localUser);
        setLoading(false);
        return { mode: "local" as const };
      }
      throw error;
    }
  };

  const signUpWithFallback = async (email: string, password: string, displayName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { mode: "cloud" as const };
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes("Failed to fetch") || error?.name === "TypeError") {
        const localUser = writeLocalUser(email, displayName);
        setUser(localUser);
        setLoading(false);
        return { mode: "local" as const };
      }
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signout failures in local mode
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return { user, loading, signOut, signInWithFallback, signUpWithFallback };
};
