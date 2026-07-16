import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvite, listMembers, removeMember, revokeInvite } from "@/lib/workshop.functions";
import { CreateInviteSchema, parseOrThrow } from "@/lib/schemas";
import { useAuth } from "@/hooks/useAuth";

export function TeamSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"mecanico" | "dono">("mecanico");
  const [inviting, setInviting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => listMembers(),
  });

  const isOwner = (data?.members ?? []).some((m) => m.id === user?.id && m.roles.includes("dono"));

  if (isLoading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Carregando equipe...</p>
      </Card>
    );
  }

  if (!isOwner) return null;

  const members = data?.members ?? [];
  const invites = data?.invites ?? [];
  const pendingEmails = new Set(invites.map((i) => i.email.toLowerCase()));

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { email: normalized, role: inviteRole } = parseOrThrow(CreateInviteSchema, {
        email: email.trim().toLowerCase(),
        role,
      });
      if (pendingEmails.has(normalized)) {
        toast.error("Já existe um convite pendente para este e-mail.");
        return;
      }
      setInviting(true);
      const inv = await createInvite({ data: { email: normalized, role: inviteRole } });
      const link = `${window.location.origin}/convite/${inv.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Convite criado! Link copiado para a área de transferência.");
      setEmail("");
      await refetch();
      qc.invalidateQueries({ queryKey: ["team_members"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setInviting(false);
    }
  }

  async function copyLink(token: string) {
    const link = `${window.location.origin}/convite/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  }

  async function handleRevoke(inviteId: string) {
    try {
      await revokeInvite({ data: { inviteId } });
      toast.success("Convite revogado.");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleRemove(userId: string, nome: string | null) {
    if (!confirm(`Remover ${nome ?? "este membro"} da oficina?`)) return;
    try {
      await removeMember({ data: { userId } });
      toast.success("Membro removido.");
      await refetch();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="font-bold">Equipe</h2>
      <form onSubmit={handleInvite} className="space-y-3">
        <div>
          <Label>E-mail do convite</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mecanico@email.com"
          />
        </div>
        <div>
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "mecanico" | "dono")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mecanico">Mecânico</SelectItem>
              <SelectItem value="dono">Dono</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={inviting}>
          {inviting ? "Convidando..." : "Convidar e copiar link"}
        </Button>
      </form>

      {members.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Membros</h3>
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{m.nome ?? "Sem nome"}</span>
                  <span className="text-muted-foreground ml-2">{m.roles.join(", ") || "—"}</span>
                </div>
                {m.id !== user?.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover membro"
                    onClick={() => handleRemove(m.id, m.nome)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Convites pendentes</h3>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{inv.email}</span>
                  <span className="text-muted-foreground ml-2">{inv.role}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Copiar link"
                    onClick={() => copyLink(inv.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Revogar convite"
                    onClick={() => handleRevoke(inv.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
