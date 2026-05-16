import { createFileRoute } from "@tanstack/react-router";
import { memo, useCallback, useMemo, useState } from "react";
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useParts, useUpsertPart, useDeletePart, type Part } from "@/hooks/useParts";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estoque")({ component: EstoquePage });

const PartCard = memo(function PartCard({
  part,
  onEdit,
  onDelete,
}: {
  part: Part;
  onEdit: (p: Part) => void;
  onDelete: (p: Part) => void;
}) {
  const baixo = useMemo(
    () => Number(part.estoque_minimo) > 0 && Number(part.quantidade) <= Number(part.estoque_minimo),
    [part.estoque_minimo, part.quantidade]
  );
  const margem = useMemo(
    () =>
      Number(part.preco_venda) > 0
        ? ((Number(part.preco_venda) - Number(part.custo_unitario)) / Number(part.preco_venda)) * 100
        : 0,
    [part.preco_venda, part.custo_unitario]
  );
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate">{part.nome}</span>
          {part.codigo && (
            <span className="text-xs text-muted-foreground font-mono">#{part.codigo}</span>
          )}
          {baixo && (
            <span className="text-[10px] font-bold uppercase bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
              baixo
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
          <span>
            Custo: <span className="font-medium">{formatBRL(part.custo_unitario)}</span>
          </span>
          <span>
            Venda: <span className="font-medium">{formatBRL(part.preco_venda)}</span>
          </span>
          {Number(part.preco_venda) > 0 && (
            <span className="text-money font-medium">margem {margem.toFixed(0)}%</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={cn("font-display text-xl font-bold", baixo ? "text-destructive" : "")}>
          {Number(part.quantidade)}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase">{part.unidade}</div>
      </div>
      <div className="flex flex-col gap-1">
        <Button size="icon" variant="ghost" onClick={() => onEdit(part)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={() => onDelete(part)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
});

const EMPTY = {
  nome: "",
  codigo: "",
  quantidade: "0",
  estoque_minimo: "0",
  custo_unitario: "0",
  preco_venda: "0",
  unidade: "un",
  observacao: "",
};

function EstoquePage() {
  const { data: parts, isLoading } = useParts();
  const upsert = useUpsertPart();
  const del = useDeletePart();
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const list = useMemo(() => {
    const s = busca.toLowerCase().trim();
    return (parts ?? []).filter(
      (p) =>
        !s ||
        p.nome.toLowerCase().includes(s) ||
        (p.codigo ?? "").toLowerCase().includes(s)
    );
  }, [parts, busca]);

  const lowStock = useMemo(
    () =>
      (parts ?? []).filter(
        (p) => Number(p.estoque_minimo) > 0 && Number(p.quantidade) <= Number(p.estoque_minimo)
      ),
    [parts]
  );

  const totalValor = useMemo(
    () => (parts ?? []).reduce((s, p) => s + Number(p.quantidade) * Number(p.custo_unitario), 0),
    [parts]
  );

  function openNew() {
    setEditId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  const openEdit = useCallback((p: Part) => {
    setEditId(p.id);
    setForm({
      nome: p.nome,
      codigo: p.codigo ?? "",
      quantidade: String(p.quantidade),
      estoque_minimo: String(p.estoque_minimo),
      custo_unitario: String(p.custo_unitario),
      preco_venda: String(p.preco_venda),
      unidade: p.unidade,
      observacao: p.observacao ?? "",
    });
    setOpen(true);
  }, []);

  function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da peça");
      return;
    }
    upsert.mutate(
      {
        id: editId ?? undefined,
        nome: form.nome.trim(),
        codigo: form.codigo.trim() || null,
        quantidade: Number(form.quantidade.replace(",", ".")) || 0,
        estoque_minimo: Number(form.estoque_minimo.replace(",", ".")) || 0,
        custo_unitario: Number(form.custo_unitario.replace(",", ".")) || 0,
        preco_venda: Number(form.preco_venda.replace(",", ".")) || 0,
        unidade: form.unidade.trim() || "un",
        observacao: form.observacao.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(editId ? "Peça atualizada" : "Peça cadastrada");
          setOpen(false);
        },
        onError: (e) => toast.error("Erro: " + (e as Error).message),
      }
    );
  }

  const excluir = useCallback((p: Part) => {
    if (!confirm(`Excluir "${p.nome}" do estoque?`)) return;
    del.mutate(p.id, { onSuccess: () => toast.success("Peça removida") });
  }, [del]);

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto pb-24">
      <header className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Estoque de Peças</h1>
          <p className="text-sm text-muted-foreground">
            {parts?.length ?? 0} item(ns) · Valor em estoque {formatBRL(totalValor)}
          </p>
        </div>
        <Button onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> Nova peça
        </Button>
      </header>

      {lowStock.length > 0 && (
        <Card className="p-3 mb-4 border-destructive/40 bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="text-sm">
            <span className="font-bold text-destructive">{lowStock.length}</span>{" "}
            peça(s) abaixo do estoque mínimo:{" "}
            <span className="text-muted-foreground">
              {lowStock.slice(0, 3).map((p) => p.nome).join(", ")}
              {lowStock.length > 3 ? "…" : ""}
            </span>
          </div>
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou código..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">Carregando...</div>
      ) : list.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Nenhuma peça cadastrada.</p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {list.map((p) => (
            <PartCard key={p.id} part={p} onEdit={openEdit} onDelete={excluir} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar peça" : "Nova peça"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Filtro de óleo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="SKU/ref."
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  placeholder="un, L, kg..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade</Label>
                <Input
                  inputMode="decimal"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </div>
              <div>
                <Label>Estoque mínimo</Label>
                <Input
                  inputMode="decimal"
                  value={form.estoque_minimo}
                  onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Custo (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.custo_unitario}
                  onChange={(e) => setForm({ ...form, custo_unitario: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço de venda (R$)</Label>
                <Input
                  inputMode="decimal"
                  value={form.preco_venda}
                  onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observação</Label>
              <Input
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder="Fornecedor, marca..."
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
