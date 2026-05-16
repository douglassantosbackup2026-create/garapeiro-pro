import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

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

  const loadProfile = async (uid: string) => {
    const p = await fetchProfile(uid);
    setProfile(p);
    setCurrentWorkshopId(p?.workshop_id ?? null);
  };

  useEffect(() => {
    // Initial session
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
        // defer to avoid deadlock
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setCurrentWorkshopId(null);
      }
      qc.invalidateQueries();
      router.invalidate();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
    qc.invalidateQueries();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentWorkshopId(null);
    qc.clear();
  };

  return (
    <Ctx.Provider
      value={{
        loading,
        session,
        user: session?.user ?? null,
        profile,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}