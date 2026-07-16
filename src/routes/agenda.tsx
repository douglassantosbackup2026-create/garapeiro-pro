import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Phone, Calendar, Clock, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ALL_SUBCATEGORIES } from "@/lib/service-categories";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  agendado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  concluido: "bg-status-done text-status-done-foreground",
  cancelado: "bg-status-cancel text-status-cancel-foreground",
  faltou: "bg-destructive/20 text-destructive",
};

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 480, label: "Dia inteiro" },
];

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  agendado: ["confirmado", "cancelado", "faltou"],
  confirmado: ["em_andamento", "cancelado", "faltou"],
  em_andamento: ["concluido", "cancelado"],
  concluido: [],
  cancelado: [],
  faltou: ["agendado"],
};

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function dateKey(iso: string) {
  return iso.slice(0, 10);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function getWeekDays(baseDate: string): string[] {
  const d = new Date(baseDate + "T12:00:00");
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd.toISOString().slice(0, 10);
  });
}

function formatDayLabel(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
  });
}

function formatMonthYear(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

const today = new Date().toISOString().slice(0, 10);

const BLANK: AppointmentInput = {
  nome_cliente: "",
  telefone: "",
  servico_previsto: "",
  categoria: "",
  data_hora: today + "T09:00",
  duracao_min: 60,
  observacoes: "",
};

type AppointmentForm = AppointmentInput & { date: string; time: string };

function AgendaPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(today);
  const weekDays = getWeekDays(selectedDate);

  const weekStart = weekDays[0] + "T00:00:00";
  const weekEnd = weekDays[6] + "T23:59:59";

  const { data: appointments } = useAppointments(weekStart, weekEnd);
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<AppointmentForm>({
    ...BLANK,
    date: today,
    time: "09:00",
  });
  const [statusDialog, setStatusDialog] = useState<Appointment | null>(null);

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const day of weekDays) map[day] = [];
    for (const a of appointments ?? []) {
      const k = dateKey(a.data_hora);
      if (map[k]) map[k].push(a);
    }
    return map;
  }, [appointments, weekDays]);

  const dayAppts = byDay[selectedDate] ?? [];

  function openNew() {
    setEditingAppt(null);
    const defaultTime = "09:00";
    setForm({
      ...BLANK,
      date: selectedDate,
      time: defaultTime,
      data_hora: selectedDate + "T" + defaultTime,
    });
    setDialogOpen(true);
  }

  function openEdit(a: Appointment) {
    setEditingAppt(a);
    const dt = new Date(a.data_hora);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setForm({
      nome_cliente: a.nome_cliente,
      telefone: a.telefone ?? "",
      servico_previsto: a.servico_previsto ?? "",
      categoria: a.categoria ?? "",
      data_hora: a.data_hora,
      duracao_min: a.duracao_min,
      observacoes: a.observacoes ?? "",
      date,
      time,
    });
    setDialogOpen(true);
  }

  function handleFormChange(field: keyof AppointmentForm, value: string | number) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "date" || field === "time") {
        next.data_hora = `${next.date}T${next.time}`;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!form.nome_cliente.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    const payload: AppointmentInput = {
      nome_cliente: form.nome_cliente,
      telefone: form.telefone || null,
      servico_previsto: form.servico_previsto || null,
      categoria: form.categoria || null,
      data_hora: form.data_hora,
      duracao_min: form.duracao_min,
      observacoes: form.observacoes || null,
    };
    try {
      if (editingAppt) {
        await updateAppt.mutateAsync({ id: editingAppt.id, ...payload });
        toast.success("Agendamento atualizado");
      } else {
        await createAppt.mutateAsync(payload);
        toast.success("Agendamento criado");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(a: Appointment) {
    if (!confirm(`Remover agendamento de ${a.nome_cliente}?`)) return;
    try {
      await deleteAppt.mutateAsync(a.id);
      toast.success("Agendamento removido");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleStatusChange(a: Appointment, newStatus: AppointmentStatus) {
    try {
      await updateAppt.mutateAsync({ id: a.id, status: newStatus });
      setStatusDialog(null);
      toast.success(`Status: ${STATUS_LABEL[newStatus]}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function handleConvertToOS(a: Appointment) {
    navigate({
      to: "/os/nova",
      search: { apptId: a.id, nomeCliente: a.nome_cliente, telefone: a.telefone ?? "" },
    });
  }

  return (
    <div className="px-4 md:px-8 py-5 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" /> Agendar
        </Button>
      </header>

      {/* Week strip */}
      <Card className="p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setSelectedDate(addDays(weekDays[0], -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium capitalize">{formatMonthYear(selectedDate)}</span>
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={() => setSelectedDate(addDays(weekDays[0], 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const count = byDay[day]?.length ?? 0;
            const isSelected = day === selectedDate;
            const isToday = day === today;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center py-1.5 rounded-md text-xs transition-colors",
                  isSelected && "bg-primary text-primary-foreground",
                  !isSelected && isToday && "border border-primary text-primary",
                  !isSelected && !isToday && "hover:bg-muted",
                )}
              >
                <span className="uppercase font-medium">{formatDayLabel(day).split(",")[0]}</span>
                <span
                  className={cn("text-base font-bold", isSelected && "text-primary-foreground")}
                >
                  {new Date(day + "T12:00:00").getDate()}
                </span>
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-1",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold capitalize">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        <span className="text-sm text-muted-foreground">{dayAppts.length} agendamento(s)</span>
      </div>

      {/* Appointments list */}
      {dayAppts.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento"
          description="Clique em Agendar para marcar um horário."
          actionLabel="Agendar"
          onAction={openNew}
        />
      ) : (
        <div className="space-y-2">
          {dayAppts.map((a) => (
            <Card key={a.id} className="p-3">
              <div className="flex items-start gap-3">
                {/* Time */}
                <div className="text-center shrink-0 min-w-[44px]">
                  <div className="text-base font-bold font-mono">{formatHour(a.data_hora)}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {a.duracao_min < 60
                      ? `${a.duracao_min}min`
                      : `${Math.round(a.duracao_min / 60)}h`}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.nome_cliente}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold rounded-full px-2 py-0.5",
                        STATUS_COLOR[a.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                  {a.servico_previsto && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Wrench className="h-3 w-3" />
                      {a.servico_previsto}
                    </div>
                  )}
                  {a.observacoes && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {a.observacoes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {a.telefone && <WhatsAppButton phone={a.telefone} />}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2"
                    onClick={() => setStatusDialog(a)}
                  >
                    Status
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-2"
                    onClick={() => openEdit(a)}
                  >
                    Editar
                  </Button>
                  {a.status !== "concluido" && a.status !== "cancelado" && (
                    <Button
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleConvertToOS(a)}
                    >
                      → OS
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAppt ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nome do cliente *</Label>
              <Input
                value={form.nome_cliente}
                onChange={(e) => handleFormChange("nome_cliente", e.target.value)}
                placeholder="Ex.: João Silva"
              />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input
                value={form.telefone ?? ""}
                onChange={(e) => handleFormChange("telefone", e.target.value)}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div>
              <Label>Serviço previsto</Label>
              <Input
                value={form.servico_previsto ?? ""}
                onChange={(e) => handleFormChange("servico_previsto", e.target.value)}
                placeholder="Ex.: Troca de óleo, Alinhamento..."
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={form.categoria ?? ""}
                onChange={(e) => handleFormChange("categoria", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecionar...</option>
                {ALL_SUBCATEGORIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                />
              </div>
              <div>
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => handleFormChange("time", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Duração estimada</Label>
              <select
                value={form.duracao_min}
                onChange={(e) => handleFormChange("duracao_min", Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={form.observacoes ?? ""}
                onChange={(e) => handleFormChange("observacoes", e.target.value)}
                placeholder="Informações adicionais"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={createAppt.isPending || updateAppt.isPending}
              >
                {editingAppt ? "Salvar" : "Agendar"}
              </Button>
              {editingAppt && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    handleDelete(editingAppt);
                    setDialogOpen(false);
                  }}
                >
                  Excluir
                </Button>
              )}
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status dialog */}
      {statusDialog && (
        <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle>Alterar status</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 mt-2">
              {(STATUS_TRANSITIONS[statusDialog.status] ?? []).map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handleStatusChange(statusDialog, s)}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
              {(STATUS_TRANSITIONS[statusDialog.status] ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Status final — sem transições disponíveis.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
