import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { formatBRL } from "@/lib/format";
import {
  CATEGORY_GROUPS,
  ALL_SUBCATEGORIES,
  getGroupLabel,
  CATEGORY_COLORS,
  isSubCategoryOf,
  type MainCategory,
} from "@/lib/service-categories";
import {
  useServicesCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  type CatalogItem,
} from "@/hooks/useServicesCatalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/servicos")({ component: ServicosPage });

const BLANK: Omit<CatalogItem, "id" | "workshop_id" | "criada_em"> = {
  nome: "",
  descricao: null,
  categoria: "mecanica_geral",
  preco_padrao: null,
  duracao_estimada_min: 60,
  ativo: true,
};

function ServicosPage() {
  const { data: catalog } = useServicesCatalog();
  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const deleteItem = useDeleteCatalogItem();

  const [q, setQ] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(BLANK);

  const items = (catalog ?? []).filter((c) => {
    if (!c.ativo) return false;
    if (grupoFiltro !== "todos") {
      if (!isSubCategoryOf(grupoFiltro, c.categoria)) return false;
    }
    if (q) {
      const s = q.toLowerCase();
      return c.nome.toLowerCase().includes(s) || (c.descricao ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  function openNew() {
    setEditing(null);
    setForm(BLANK);
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditing(item);
    setForm({
      nome: item.nome,
      descricao: item.descricao,
      categoria: item.categoria,
      preco_padrao: item.preco_padrao,
      duracao_estimada_min: item.duracao_estimada_min,
      ativo: item.ativo,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, ...form });
        toast.success("Serviço atualizado");
      } else {
        await createItem.mutateAsync(form);
        toast.success("Serviço adicionado ao catálogo");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (!confirm(`Remover "${item.nome}" do catálogo?`)) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Serviço removido");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const groupKey = (categoria: string): MainCategory => {
    const g = CATEGORY_GROUPS.find((g) => g.subcategories.some((s) => s.value === categoria));
    return (g?.key ?? "outros") as MainCategory;
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Serviços</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {catalog?.filter((c) => c.ativo).length ?? 0} serviço(s) cadastrado(s)
          </p>
        </div>
        <Button size="sm" className="gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </header>

      {/* Filtros */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar serviço..."
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setGrupoFiltro("todos")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
            grupoFiltro === "todos"
              ? "bg-secondary text-secondary-foreground border-secondary"
              : "bg-background border-border",
          )}
        >
          Todos
        </button>
        {CATEGORY_GROUPS.filter((g) => g.key !== "outros").map((g) => (
          <button
            key={g.key}
            onClick={() => setGrupoFiltro(g.key)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              grupoFiltro === g.key
                ? "bg-secondary text-secondary-foreground border-secondary"
                : "bg-background border-border",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum serviço no catálogo"
          description="Adicione serviços para acelerar a criação de OS."
          actionLabel="Adicionar serviço"
          onAction={openNew}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <Card key={item.id} className="p-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.nome}</span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold rounded-full px-2 py-0.5",
                      CATEGORY_COLORS[groupKey(item.categoria)],
                    )}
                  >
                    {getGroupLabel(item.categoria)}
                  </span>
                </div>
                {item.descricao && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.descricao}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {item.preco_padrao != null && (
                    <span className="text-sm font-bold text-money">
                      {formatBRL(item.preco_padrao)}
                    </span>
                  )}
                  {item.duracao_estimada_min != null && (
                    <span className="text-xs text-muted-foreground">
                      ~
                      {item.duracao_estimada_min >= 60
                        ? `${Math.round(item.duracao_estimada_min / 60)}h`
                        : `${item.duracao_estimada_min}min`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog novo/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Troca de óleo"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORY_GROUPS.map((g) => (
                  <optgroup key={g.key} label={g.label}>
                    {g.subcategories.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={form.descricao ?? ""}
                onChange={(e) => setForm({ ...form, descricao: e.target.value || null })}
                placeholder="Detalhes adicionais"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preco_padrao ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preco_padrao: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Duração estimada</Label>
                <select
                  value={form.duracao_estimada_min ?? 60}
                  onChange={(e) =>
                    setForm({ ...form, duracao_estimada_min: Number(e.target.value) })
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 horas</option>
                  <option value={180}>3 horas</option>
                  <option value={240}>4 horas</option>
                  <option value={480}>Dia inteiro</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={createItem.isPending || updateItem.isPending}
              >
                {editing ? "Salvar" : "Adicionar"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
