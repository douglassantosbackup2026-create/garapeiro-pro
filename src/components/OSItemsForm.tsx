import { useMemo } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartCombobox } from "@/components/PartCombobox";
import { useParts } from "@/hooks/useParts";
import { formatBRL } from "@/lib/format";
import type { OSPecaInput, OSServicoInput } from "@/hooks/useServiceOrders";

const SUGESTOES = [
  "Troca de óleo",
  "Alinhamento",
  "Balanceamento",
  "Troca de freio",
  "Revisão geral",
  "Suspensão",
  "Diagnóstico elétrico",
  "Funilaria",
  "Pintura",
  "Troca de correia",
];

type Props = {
  servicos: OSServicoInput[];
  setServicos: (v: OSServicoInput[]) => void;
  pecas: OSPecaInput[];
  setPecas: (v: OSPecaInput[]) => void;
};

export function OSItemsForm({ servicos, setServicos, pecas, setPecas }: Props) {
  const { data: inventory } = useParts();

  const { totalServ, totalPecasV, totalCusto, total, margem } = useMemo(() => {
    const totalServ = servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
    const totalPecasV = pecas.reduce(
      (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
      0
    );
    const totalCusto = pecas.reduce(
      (s, x) => s + Number(x.quantidade || 0) * Number(x.custo_unitario || 0),
      0
    );
    const total = totalServ + totalPecasV;
    return { totalServ, totalPecasV, totalCusto, total, margem: total - totalCusto };
  }, [servicos, pecas]);

  return (
    <div className="space-y-5">
      <div>
        <Label>Serviços</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setServicos([...servicos, { descricao: s, valor: 0 }])}
              className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted"
            >
              + {s}
            </button>
          ))}
        </div>
        <div className="space-y-2 mt-3">
          {servicos.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                value={s.descricao}
                onChange={(e) => {
                  const c = [...servicos];
                  c[i] = { ...c[i], descricao: e.target.value };
                  setServicos(c);
                }}
                placeholder="Descrição"
              />
              <Input
                type="number"
                value={s.valor || ""}
                onChange={(e) => {
                  const c = [...servicos];
                  c[i] = { ...c[i], valor: Number(e.target.value) };
                  setServicos(c);
                }}
                placeholder="R$"
                className="w-24"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setServicos(servicos.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setServicos([...servicos, { descricao: "", valor: 0 }])}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
          </Button>
        </div>
      </div>

      <div>
        <Label>Peças</Label>
        <div className="space-y-2 mt-2">
          {pecas.map((p, i) => {
            const stock = p.inventory_id
              ? inventory?.find((x) => x.id === p.inventory_id)
              : null;
            const semEstoque =
              stock && Number(p.quantidade || 0) > Number(stock.quantidade);
            return (
              <div key={i} className="space-y-1">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <PartCombobox
                      value={p.nome}
                      inventoryId={p.inventory_id ?? null}
                      onTypeChange={(nome) => {
                        const c = [...pecas];
                        c[i] = { ...c[i], nome };
                        setPecas(c);
                      }}
                      onPick={(pick) => {
                        const c = [...pecas];
                        c[i] = {
                          ...c[i],
                          nome: pick.nome,
                          inventory_id: pick.inventory_id,
                          custo_unitario: pick.custo_unitario,
                          valor_unitario:
                            pick.preco_venda > 0 ? pick.preco_venda : c[i].valor_unitario,
                        };
                        setPecas(c);
                      }}
                    />
                  </div>
                  <Input
                    className="col-span-2"
                    type="number"
                    value={p.quantidade || ""}
                    onChange={(e) => {
                      const c = [...pecas];
                      c[i] = { ...c[i], quantidade: Number(e.target.value) };
                      setPecas(c);
                    }}
                    placeholder="Qtd"
                  />
                  <Input
                    className="col-span-4"
                    type="number"
                    value={p.valor_unitario || ""}
                    onChange={(e) => {
                      const c = [...pecas];
                      c[i] = { ...c[i], valor_unitario: Number(e.target.value) };
                      setPecas(c);
                    }}
                    placeholder="Valor unit."
                  />
                  <Button
                    type="button"
                    className="col-span-1"
                    size="icon"
                    variant="ghost"
                    onClick={() => setPecas(pecas.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {semEstoque && (
                  <div className="text-xs text-destructive flex items-center gap-1 ml-1">
                    <AlertTriangle className="h-3 w-3" />
                    Estoque insuficiente: {Number(stock!.quantidade)} disponível
                  </div>
                )}
              </div>
            );
          })}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setPecas([
                ...pecas,
                {
                  nome: "",
                  quantidade: 1,
                  valor_unitario: 0,
                  custo_unitario: 0,
                  inventory_id: null,
                },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar Peça
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="flex justify-between text-sm">
          <span>Mão de obra</span>
          <span className="font-medium">{formatBRL(totalServ)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Peças</span>
          <span className="font-medium">{formatBRL(totalPecasV)}</span>
        </div>
        {totalCusto > 0 && (
          <div className="flex justify-between text-xs mt-1 text-muted-foreground">
            <span>Custo de peças</span>
            <span>{formatBRL(totalCusto)}</span>
          </div>
        )}
        <div className="flex justify-between mt-3 pt-3 border-t">
          <span className="font-bold">Total</span>
          <span className="font-display font-bold text-2xl text-money">
            {formatBRL(total)}
          </span>
        </div>
        {totalCusto > 0 && (
          <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">Margem estimada</span>
            <span className="font-semibold text-money">{formatBRL(margem)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}