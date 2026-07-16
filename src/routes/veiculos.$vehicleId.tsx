import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { PlacaBadge } from "@/components/PlacaBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatBRL, formatDate, formatOSNumber, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/veiculos/$vehicleId")({ component: VehicleDetail });

function VehicleDetail() {
  const { vehicleId } = Route.useParams();
  const navigate = useNavigate();
  const { data: v, isLoading } = useVehicle(vehicleId);
  const updateVehicle = useUpdateVehicle();
  const [open, setOpen] = useState(false);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState<string>("");
  const [cor, setCor] = useState("");
  const [km, setKm] = useState<string>("");
  const [kmProx, setKmProx] = useState<string>("");
  const [dataUltima, setDataUltima] = useState("");
  const [intervalo, setIntervalo] = useState<string>("6");

  function openEdit() {
    if (!v) return;
    setMarca(v.marca ?? "");
    setModelo(v.modelo ?? "");
    setAno(v.ano?.toString() ?? "");
    setCor(v.cor ?? "");
    setKm(v.km?.toString() ?? "");
    setKmProx(v.km_proxima_revisao?.toString() ?? "");
    setDataUltima(v.data_ultima_revisao ?? "");
    setIntervalo((v.intervalo_revisao_meses ?? 6).toString());
    setOpen(true);
  }

  async function salvar() {
    if (!v) return;
    try {
      await updateVehicle.mutateAsync({
        id: v.id,
        patch: {
          marca: marca || null,
          modelo: modelo || null,
          ano: ano ? Number(ano) : null,
          cor: cor || null,
          km: km ? Number(km) : null,
          km_proxima_revisao: kmProx ? Number(kmProx) : null,
          data_ultima_revisao: dataUltima || null,
          intervalo_revisao_meses: intervalo ? Number(intervalo) : 6,
        },
      });
      toast.success("Veículo atualizado");
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading || !v) return <div className="p-8 text-center">Carregando...</div>;

  const orders = (v.service_orders ?? [])
    .slice()
    .sort((a, b) => new Date(b.data_entrada).getTime() - new Date(a.data_entrada).getTime());

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto">
      <button
        onClick={() => navigate({ to: "/veiculos" })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="flex items-center justify-center mb-4">
        <PlacaBadge placa={v.placa} size="xl" />
      </div>

      <Card className="p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Veículo</h3>
          <Button size="sm" variant="outline" onClick={openEdit} className="gap-1 h-7">
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
        </div>
        <div className="text-sm space-y-1">
          <div>
            {v.marca} {v.modelo} · {v.ano}
          </div>
          <div className="text-muted-foreground">
            Cor: {v.cor ?? "—"} · {v.km ?? 0} km
          </div>
          {(v.km_proxima_revisao || v.data_ultima_revisao) && (
            <div className="text-muted-foreground pt-1 border-t mt-2">
              {v.km_proxima_revisao && <div>🔧 Próxima revisão: {v.km_proxima_revisao} km</div>}
              {v.data_ultima_revisao && (
                <div>
                  Última revisão: {formatDate(v.data_ultima_revisao)} · a cada{" "}
                  {v.intervalo_revisao_meses} meses
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4 mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Proprietário</div>
          <div className="font-bold">{v.clients?.nome}</div>
          <div className="text-sm text-muted-foreground">{formatPhone(v.clients?.telefone)}</div>
        </div>
        <WhatsAppButton phone={v.clients?.telefone ?? ""} />
      </Card>

      <h3 className="font-bold mb-2 mt-5">Histórico de Serviços</h3>
      {orders.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nenhum serviço ainda neste veículo.
        </Card>
      ) : (
        <div className="relative pl-5 space-y-3">
          <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border" />
          {orders.map((o) => (
            <Link key={o.id} to="/os/$osId" params={{ osId: o.id }} className="block relative">
              <div className="absolute -left-[18px] top-3 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <Card className="p-3 hover:border-primary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    {formatOSNumber(o.numero)}
                  </span>
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDate(o.data_entrada)}
                  </span>
                </div>
                <div className="text-sm">
                  {(o.service_order_services ?? []).map((s) => s.descricao).join(", ") || "—"}
                </div>
                <div className="text-money font-bold text-sm mt-1">{formatBRL(o.total_geral)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Button size="lg" className="w-full mt-5 gap-1" onClick={() => navigate({ to: "/os/nova" })}>
        <Plus className="h-4 w-4" /> Nova OS para este veículo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar veículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Marca</Label>
                <Input value={marca} onChange={(e) => setMarca(e.target.value)} />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </div>
              <div>
                <Label>Ano</Label>
                <Input type="number" value={ano} onChange={(e) => setAno(e.target.value)} />
              </div>
              <div>
                <Label>Cor</Label>
                <Input value={cor} onChange={(e) => setCor(e.target.value)} />
              </div>
              <div>
                <Label>KM atual</Label>
                <Input type="number" value={km} onChange={(e) => setKm(e.target.value)} />
              </div>
              <div>
                <Label>KM próxima revisão</Label>
                <Input type="number" value={kmProx} onChange={(e) => setKmProx(e.target.value)} />
              </div>
              <div>
                <Label>Data última revisão</Label>
                <Input
                  type="date"
                  value={dataUltima}
                  onChange={(e) => setDataUltima(e.target.value)}
                />
              </div>
              <div>
                <Label>Intervalo (meses)</Label>
                <Input
                  type="number"
                  value={intervalo}
                  onChange={(e) => setIntervalo(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Os campos de revisão alimentam os alertas inteligentes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={updateVehicle.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
