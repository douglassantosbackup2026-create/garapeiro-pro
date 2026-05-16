import { useCallback, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useParts, type Part } from "@/hooks/useParts";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PartPick = {
  nome: string;
  inventory_id: string | null;
  preco_venda: number;
  custo_unitario: number;
  estoque: number | null;
};

type Props = {
  value: string;
  inventoryId: string | null;
  onPick: (p: PartPick) => void;
  onTypeChange: (nome: string) => void;
};

export function PartCombobox({ value, inventoryId, onPick, onTypeChange }: Props) {
  const { data: parts } = useParts();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected: Part | undefined = useMemo(
    () => parts?.find((p) => p.id === inventoryId),
    [parts, inventoryId]
  );

  const filteredParts = useMemo(() => {
    if (!query) return (parts ?? []).slice(0, 30);
    const q = query.toLowerCase();
    return (parts ?? [])
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.codigo ?? "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [parts, query]);

  const handleSelect = useCallback(
    (p: Part) => {
      onPick({
        nome: p.nome,
        inventory_id: p.id,
        preco_venda: Number(p.preco_venda),
        custo_unitario: Number(p.custo_unitario),
        estoque: Number(p.quantidade),
      });
      setOpen(false);
      setQuery("");
    },
    [onPick]
  );

  const handleFreeText = useCallback(() => {
    onPick({
      nome: query.trim() || value,
      inventory_id: null,
      preco_venda: 0,
      custo_unitario: 0,
      estoque: null,
    });
    setOpen(false);
    setQuery("");
  }, [onPick, query, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
        >
          <span className="truncate text-left">
            {selected ? (
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-primary" />
                {selected.nome}
              </span>
            ) : value ? (
              value
            ) : (
              "Buscar peça…"
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nome ou código…"
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              onTypeChange(v);
            }}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={handleFreeText}
              >
                + Usar “{query || value}” como peça avulsa
              </button>
            </CommandEmpty>
            <CommandGroup>
              {filteredParts.map((p) => {
                  const isSel = p.id === inventoryId;
                  const baixo =
                    Number(p.estoque_minimo) > 0 &&
                    Number(p.quantidade) <= Number(p.estoque_minimo);
                  return (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => handleSelect(p)}
                      className="flex items-start gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          isSel ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBRL(p.preco_venda)} ·{" "}
                          <span className={cn(baixo && "text-destructive font-semibold")}>
                            {Number(p.quantidade)} {p.unidade}
                          </span>
                          {p.codigo ? ` · #${p.codigo}` : ""}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              {query && (
                <CommandItem value="__free" onSelect={handleFreeText} className="text-primary">
                  + Usar “{query}” como peça avulsa
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}