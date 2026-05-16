import { supabase } from "@/integrations/supabase/client";

async function invoke<T>(action: string, data?: Record<string, unknown>): Promise<T> {
  const { data: result, error } = await supabase.functions.invoke("workshop-api", {
    body: { action, ...(data ?? {}) },
  });
  if (error) throw new Error(error.message);
  if (result == null) throw new Error("Empty response from edge function");
  return result as T;
}

export const createWorkshop = ({
  data,
}: {
  data: {
    nome: string;
    telefone?: string | null;
    endereco?: string | null;
    profileNome?: string | null;
  };
}) => invoke<{ workshopId: string }>("createWorkshop", data);

export const createInvite = ({
  data,
}: {
  data: { email: string; role?: "dono" | "mecanico" };
}) =>
  invoke<{ id: string; token: string; email: string; role: string; expires_at: string }>(
    "createInvite",
    data,
  );

export const acceptInvite = ({ data }: { data: { token: string } }) =>
  invoke<{ workshopId: string }>("acceptInvite", data);

export const listMembers = () =>
  invoke<{
    members: Array<{ id: string; nome: string | null; avatar_url: string | null; roles: string[] }>;
    invites: Array<{
      id: string;
      email: string;
      role: string;
      token: string;
      expires_at: string;
      used_at: string | null;
      criada_em: string;
    }>;
  }>("listMembers");

export const removeMember = ({ data }: { data: { userId: string } }) =>
  invoke<{ ok: boolean }>("removeMember", data);

export const revokeInvite = ({ data }: { data: { inviteId: string } }) =>
  invoke<{ ok: boolean }>("revokeInvite", data);
