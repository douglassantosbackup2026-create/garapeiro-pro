import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceOrders, useUpdateOSStatus, type OSStatus } from "@/hooks/useServiceOrders";
import { useWorkshop } from "@/hooks/useWorkshop";
import { PlacaBadge } from "@/components/PlacaBadge";
import { formatBRL, formatOSNumber, daysBetween } from "@/lib/format";
import { buildWhatsappUrl, renderAtualizacao } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/os/kanban")({ component: KanbanPage });

type ColumnTone =
  | "border-status-waiting"
  | "border-status-progress"
  | "border-status-part"
  | "border-status-done"
  | "border-status-delivered"
  | "border-status-cancel";

const COLUMNS: { status: OSStatus; label: string; tone: ColumnTone }[] = [
  { status: "aguardando_aprovacao", label: "Aguardando", tone: "border-status-waiting" },
  { status: "em_andamento", label: "Em execução", tone: "border-status-progress" },
  { status: "aguardando_peca", label: "Aguard. peça", tone: "border-status-part" },
  { status: "concluido", label: "Pronto", tone: "border-status-done" },
  { status: "entregue", label: "Entregue", tone: "border-status-delivered" },
  { status: "cancelado", label: "Cancelado", tone: "border-status-cancel" },
];

type OSListItem = NonNullable<ReturnType<typeof useServiceOrders>["data"]>[number];

type OSItem = {
  id: string;
  numero: number;
  status: OSStatus;
  total_geral: number;
  data_entrada: string;
  clients: { nome: string; telefone?: string } | null;
  vehicles: { placa: string; marca?: string | null; modelo?: string | null } | null;
};

function toKanbanItem(o: OSListItem): OSItem {
  return {
    id: o.id,
    numero: o.numero,
    status: o.status,
    total_geral: Number(o.total_geral),
    data_entrada: o.data_entrada,
    clients: o.clients,
    vehicles: o.vehicles,
  };
}

function isOSStatus(value: string | number): value is OSStatus {
  return COLUMNS.some((c) => c.status === value);
}

function KanbanPage() {
  const { data: workshop } = useWorkshop();
  const { data: orders } = useServiceOrders();
  const update = useUpdateOSStatus();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const items = useMemo(() => (orders ?? []).map(toKanbanItem), [orders]);

  const grouped = useMemo(() => {
    const g = {} as Record<OSStatus, OSItem[]>;
    for (const c of COLUMNS) g[c.status] = [];
    for (const o of items) {
      if (g[o.status]) g[o.status].push(o);
    }
    return g;
  }, [items]);

  const activeOS = useMemo(() => items.find((o) => o.id === activeId) ?? null, [activeId, items]);

  const handleOpen = useCallback(
    (id: string) => navigate({ to: "/os/$osId", params: { osId: id } }),
    [navigate],
  );

  const onDragStart = useCallback((e: DragStartEvent) => setActiveId(String(e.active.id)), []);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      if (!e.over) return;
      const overId = String(e.over.id);
      if (!isOSStatus(overId)) return;
      const newStatus = overId;
      const id = String(e.active.id);
      const os = items.find((o) => o.id === id);
      if (!os || os.status === newStatus) return;
      update.mutate(
        { id, status: newStatus },
        {
          onSuccess: () => {
            const label = COLUMNS.find((c) => c.status === newStatus)?.label ?? newStatus;
            toast.success(`OS movida para ${label}`);
            const phone = os.clients?.telefone;
            if (phone && workshop) {
              const veiculo = [os.vehicles?.marca, os.vehicles?.modelo].filter(Boolean).join(" ");
              const url = buildWhatsappUrl(
                phone,
                renderAtualizacao(
                  {
                    numero: os.numero,
                    cliente_nome: os.clients?.nome ?? "",
                    veiculo,
                    placa: os.vehicles?.placa ?? "",
                    servicos: [],
                    pecas: [],
                    total: 0,
                    status: newStatus,
                  },
                  workshop,
                ),
              );
              toast("Avisar o cliente no WhatsApp?", {
                action: {
                  label: "Abrir WhatsApp",
                  onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
                },
                duration: 8000,
              });
            }
          },
          onError: () => toast.error("Não consegui mover a OS"),
        },
      );
    },
    [items, update, workshop],
  );

  return (
    <div className="px-4 md:px-8 py-5 max-w-[1400px] mx-auto">
      <header className="flex items-center justify-between mb-4 gap-2">
        <h1 className="text-2xl font-bold">Painel de OS</h1>
        <div className="flex gap-2">
          <Link to="/os">
            <Button variant="outline" size="sm" className="gap-1">
              <List className="h-4 w-4" /> Lista
            </Button>
          </Link>
          <Link to="/os/nova">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Nova OS
            </Button>
          </Link>
        </div>
      </header>

      <p className="text-sm text-muted-foreground mb-4">
        Arraste os cards entre as colunas para atualizar o status.
      </p>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2 min-h-[420px]">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tone={col.tone}
              items={grouped[col.status] ?? []}
              onOpen={handleOpen}
            />
          ))}
        </div>
        <DragOverlay>{activeOS ? <KanbanCard os={activeOS} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

type ColumnProps = {
  status: OSStatus;
  label: string;
  tone: ColumnTone;
  items: OSItem[];
  onOpen: (id: string) => void;
};

type DraggableCardProps = {
  os: OSItem;
  onOpen: () => void;
};

type KanbanCardProps = {
  os: OSItem;
  dragging?: boolean;
};

const Column = memo(function Column({ status, label, tone, items, onOpen }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = items.reduce((s, o) => s + Number(o.total_geral || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border-2 bg-card/40 p-2 min-h-[200px] min-w-[240px] shrink-0 transition-colors",
        tone,
        isOver && "bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm">{label}</h3>
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">{formatBRL(total)}</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Vazio</p>
        ) : (
          items.map((o) => <DraggableCard key={o.id} os={o} onOpen={() => onOpen(o.id)} />)
        )}
      </div>
    </div>
  );
});

const DraggableCard = memo(function DraggableCard({ os, onOpen }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: os.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <KanbanCard os={os} />
    </div>
  );
});

const KanbanCard = memo(function KanbanCard({ os, dragging }: KanbanCardProps) {
  const dias = daysBetween(os.data_entrada);
  return (
    <div
      className={cn(
        "rounded-md bg-card border p-2.5 shadow-sm",
        dragging && "shadow-lg ring-2 ring-primary",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-mono text-xs font-bold text-muted-foreground">
          {formatOSNumber(os.numero)}
        </span>
        <PlacaBadge placa={os.vehicles?.placa ?? ""} size="sm" />
      </div>
      <div className="text-sm font-medium truncate">{os.clients?.nome ?? "—"}</div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-money font-bold text-sm">{formatBRL(os.total_geral)}</span>
        <span
          className={cn(
            "text-[11px] text-muted-foreground",
            dias > 7 && "text-destructive font-semibold",
          )}
        >
          {dias === 0 ? "hoje" : `${dias}d`}
        </span>
      </div>
    </div>
  );
});
