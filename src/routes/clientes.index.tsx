import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useMemo, useState } from "react";
import { Search, Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useClients } from "@/hooks/useClients";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { EmptyState } from "@/components/EmptyState";
import { formatPhone, formatDate, daysBetween } from "@/lib/format";

export const Route = createFileRoute("/clientes/")({
  validateSearch: (search: Record<string, unknown>): { novo?: number } => {
    const raw = search.novo;
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : undefined;
    return { novo: n !== undefined && !Number.isNaN(n) ? n : undefined };
  },
  component: Clientes,
});

const COLORS = [
  "bg-primary",
  "bg-money",
  "bg-status-progress",
  "bg-status-part",
  "bg-status-cancel",
];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

type ClientRow = NonNullable<ReturnType<typeof useClients>["data"]>[number];

const ClientCard = memo(function ClientCard({ c }: { c: ClientRow }) {
  const lastOS = useMemo(() => {
    let last: ClientRow["service_orders"][number] | null = null;
    let maxTime = -Infinity;
    for (const o of c.service_orders ?? []) {
      const t = new Date(o.data_entrada).getTime();
      if (t > maxTime) {
        maxTime = t;
        last = o;
      }
    }
    return last;
  }, [c.service_orders]);

  const dias = useMemo(() => (lastOS ? daysBetween(lastOS.data_entrada) : null), [lastOS]);

  return (
    <Link to="/clientes/$clientId" params={{ clientId: c.id }} className="block">
      <Card className="p-3 flex items-center gap-3 hover:border-primary">
        <div
          className={`h-10 w-10 shrink-0 rounded-full text-white flex items-center justify-center font-bold ${colorFor(c.nome)}`}
        >
          {c.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{c.nome}</span>
            {dias !== null && dias > 90 && (
              <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 rounded-full font-bold">
                +90 dias
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatPhone(c.telefone)} · {c.vehicles?.length ?? 0} veículo(s)
            {lastOS ? ` · última: ${formatDate(lastOS.data_entrada)}` : ""}
          </div>
        </div>
        <WhatsAppButton phone={c.telefone} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Card>
    </Link>
  );
});

function Clientes() {
  const { data: clients } = useClients();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return clients ?? [];
    const s = q.toLowerCase();
    return (clients ?? []).filter(
      (c) => c.nome.toLowerCase().includes(s) || c.telefone.includes(s),
    );
  }, [clients, q]);

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nome ou telefone"
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente"
          description="Cadastre seu primeiro cliente."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ClientCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
