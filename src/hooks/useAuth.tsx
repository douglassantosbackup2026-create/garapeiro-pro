import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setCurrentWorkshopId } from "@/lib/workshop";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export type Profile = Pick<ProfileRow, "id" | "workshop_id" | "nome" | "avatar_url">;

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Atualiza sessão/perfil logo após signUp (evita redirect para login no onboarding). */
  adoptSession: (session: Session) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

const AUTH_QUERY_KEYS = [
  "workshop", "clients", "vehicles", "service_orders", "parts",
  "smart_alerts", "return_alerts", "payments", "appointments",
  "dashboard_stats", "financial_report", "services_catalog",
];

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, workshop_id, nome, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[auth] fetchProfile error", error);
    return null;
  }
  if (!data) {
    const payload: ProfileInsert = { id: userId };
    const { data: created, error: insErr } = await supabase
      .from("profiles")
      .insert(payload)
      .select("id, workshop_id, nome, avatar_url")
      .single();
    if (insErr) {
      console.error("[auth] create profile error", insErr);
      return null;
    }
    return created;
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const qc = useQueryClient();

  const loadProfile = useCallback(async (uid: string) => {
    const p = await fetchProfile(uid);
    setProfile(p);
    setCurrentWorkshopId(p?.workshop_id ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setCurrentWorkshopId(null);
      }
      AUTH_QUERY_KEYS.forEach(key => qc.invalidateQueries({ queryKey: [key] }));
      router.invalidate();
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile, qc, router]);

  const adoptSession = useCallback(
    async (sess: Session) => {
      setSession(sess);
      if (sess.user) await loadProfile(sess.user.id);
    },
    [loadProfile],
  );

  const refreshProfile = useCallback(async () => {
    const { data: { session: current } } = await supabase.auth.getSession();
    const uid = current?.user?.id ?? session?.user?.id;
    if (uid) await loadProfile(uid);
    qc.invalidateQueries({ queryKey: ["workshop"] });
  }, [session, loadProfile, qc]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentWorkshopId(null);
    qc.clear();
  }, [qc]);

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      adoptSession,
      refreshProfile,
      signOut,
    }),
    [loading, session, profile, adoptSession, refreshProfile, signOut],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}