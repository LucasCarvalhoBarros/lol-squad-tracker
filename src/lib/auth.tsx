import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthRole = "admin" | "guest";
const KEY = "lolft.auth";
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin2026lolfriends";

type AuthState = { role: AuthRole | null };

type Ctx = {
  role: AuthRole | null;
  isAdmin: boolean;
  isGuest: boolean;
  isAuthed: boolean;
  isReady: boolean;
  login: (user: string, pass: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ role: null });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (s: AuthState) => {
    setState(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  };

  const value: Ctx = {
    role: state.role,
    isAdmin: state.role === "admin",
    isGuest: state.role === "guest",
    isAuthed: state.role !== null,
    login: (user, pass) => {
      if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
        persist({ role: "admin" });
        return true;
      }
      return false;
    },
    loginAsGuest: () => persist({ role: "guest" }),
    logout: () => {
      persist({ role: null });
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
