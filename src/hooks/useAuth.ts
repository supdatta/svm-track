import { useEffect, useState } from "react";

type ReplitUser = {
  id: string;
  name: string;
  profileImage?: string;
};

type LocalUser = {
  id: string;
  email: string | null;
  user_metadata: { display_name?: string };
  isLocal: true;
};

type AppUser = ReplitUser | LocalUser;

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

    fetch("/api/auth/user")
      .then((r) => r.json())
      .then(({ user: replitUser }) => {
        if (replitUser) {
          localStorage.removeItem(LOCAL_AUTH_KEY);
          setUser(replitUser);
        } else if (!readLocalUser()) {
          setUser(null);
        }
      })
      .catch(() => {
        if (!readLocalUser()) setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signInWithFallback = async (email: string, _password: string) => {
    const localUser = writeLocalUser(email);
    setUser(localUser);
    setLoading(false);
    return { mode: "local" as const };
  };

  const signUpWithFallback = async (email: string, _password: string, displayName?: string) => {
    const localUser = writeLocalUser(email, displayName);
    setUser(localUser);
    setLoading(false);
    return { mode: "local" as const };
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setUser(null);
    setLoading(false);
  };

  return { user, loading, signOut, signInWithFallback, signUpWithFallback };
};
