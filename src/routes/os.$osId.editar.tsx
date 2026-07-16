import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OSItemsForm } from "@/components/OSItemsForm";
import {
  useServiceOrder,
  useUpdateServiceOrder,
  type OSPecaInput,
  type OSServicoInput,
} from "@/hooks/useServiceOrders";
import { formatOSNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/os/$osId/editar")({ component: EditOS });

const PAGAMENTOS: { value: Database["public"]["Enums"]["forma_pagamento"]; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "parcelado", label: "Parcelado" },
  { value: "a_combinar", label: "A combinar" },
];

function EditOS() {
  const { osId } = Route.useParams();
  const navigate = useNavigate();
  const { data: os, isLoading } = useServiceOrder(osId);
  const update = useUpdateServiceOrder();

  const [servicos, setServicos] = useState<OSServicoInput[]>([]);
  const [pecas, setPecas] = useState<OSPecaInput[]>([]);
  const [previsao, setPrevisao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pagamento, setPagamento] = useState<Database["public"]["Enums"]["forma_pagamento"] | null>(
    null,
  );
  const [km, setKm] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!os || hydrated) return;
    setServicos(
      (os.service_order_services ?? []).map((s) => ({
        descricao: s.descricao,
        valor: Number(s.valor),
      })),
    );
    setPecas(
      (os.service_order_parts ?? []).map((p) => ({
        nome: p.nome,
        quantidade: Number(p.quantidade),
        valor_unitario: Number(p.valor_unitario),
        custo_unitario: Number(p.custo_unitario || 0),
        inventory_id: p.inventory_id ?? null,
      })),
    );
    setPrevisao(os.previsao_entrega ?? "");
    setObservacoes(os.observacoes ?? "");
    setVencimento(os.vencimento_fiado ?? "");
    setPagamento(os.forma_pagamento ?? null);
    setKm(os.km_entrada ? String(os.km_entrada) : "");
    setHydrated(true);
  }, [os, hydrated]);

  if (isLoading || !os) {
    return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
  }

  const salvar = async () => {
    try {
      await update.mutateAsync({
        id: os.id,
        previsao_entrega: previsao || null,
        forma_pagamento: pagamento,
        observacoes: observacoes || null,
        vencimento_fiado: vencimento || null,
        km_entrada: km ? Number(km) : null,
        servicos,
        pecas,
      });
      toast.success("OS atualizada");
      navigate({ to: "/os/$osId", params: { osId: os.id } });
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    }
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto pb-24">
      <button
        onClick={() => navigate({ to: "/os/$osId", params: { osId: os.id } })}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold mb-1">Editar {formatOSNumber(os.numero)}</h1>
      <p className="text-sm text-muted-foreground mb-5">
        {os.clients?.nome} · {os.vehicles?.placa}
      </p>

      <Card className="p-4 mb-5">
        <OSItemsForm
          servicos={servicos}
          setServicos={setServicos}
          pecas={pecas}
          setPecas={setPecas}
        />
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Previsão de entrega</Label>
            <Input type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
          </div>
          <div>
            <Label>KM de entrada</Label>
            <Input type="number" value={km} onChange={(e) => setKm(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>
        <div>
          <Label>Forma de pagamento</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PAGAMENTOS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPagamento(pagamento === p.value ? null : p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-sm",
                  pagamento === p.value
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-background",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Vencimento (fiado / a prazo)</Label>
          <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
        </div>

        <Button size="lg" className="w-full" onClick={salvar} disabled={update.isPending}>
          {update.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
