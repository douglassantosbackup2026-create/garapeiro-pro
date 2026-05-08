import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, DollarSign, Wrench, Receipt, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFinancialReport } from "@/hooks/useFinancialReport";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({ component: RelatoriosPage });

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function RelatoriosPage() {
  const { data, isLoading } = useFinancialReport();
  const mes = MESES[new Date().getMonth()];

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  const max = Math.max(1, ...data.dias.map((d) => d.valor));
  const positiva = data.variacao >= 0;

  return (
    <div className="px-4 md:px-8 py-5 max-w-5xl mx-auto pb-24">
      <header className="mb-5">
        <h1 className="font-display text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Resumo financeiro de {mes}</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4">
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-money/10 text-money mb-2">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-xs text-muted-foreground font-medium">Faturamento</div>
          <div className="font-display font-bold text-xl mt-0.5">
            {formatBRL(data.faturamento)}
          </div>
          {data.faturamentoPrev > 0 && (
            <div
              className={cn(
                "text-[11px] mt-1 flex items-center gap-1 font-semibold",
                positiva ? "text-money" : "text-destructive"
              )}
            >
              {positiva ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {data.variacao.toFixed(1)}% vs mês anterior
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-destructive/10 text-destructive mb-2">
            <Receipt className="h-5 w-5" />
          </div>
          <div className="text-xs text-muted-foreground font-medium">A receber</div>
          <div className="font-display font-bold text-xl mt-0.5">
            {formatBRL(data.aReceber)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 text-primary mb-2">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="text-xs text-muted-foreground font-medium">OS no mês</div>
          <div className="font-display font-bold text-2xl mt-0.5">{data.osCount}</div>
        </Card>

        <Card className="p-4">
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-status-progress/30 mb-2">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-xs text-muted-foreground font-medium">Ticket médio</div>
          <div className="font-display font-bold text-xl mt-0.5">
            {formatBRL(data.ticketMedio)}
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3">Recebimentos · últimos 30 dias</h3>
        <div className="flex items-end gap-1 h-32">
          {data.dias.map((d) => {
            const h = (d.valor / max) * 100;
            return (
              <div key={d.dia} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    d.valor > 0 ? "bg-money" : "bg-muted"
                  )}
                  style={{ height: `${Math.max(h, 2)}%` }}
                  title={`${d.dia}: ${formatBRL(d.valor)}`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{data.dias[0]?.dia.slice(8, 10)}/{data.dias[0]?.dia.slice(5, 7)}</span>
          <span>hoje</span>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="font-bold mb-3">Top 5 clientes</h3>
          {data.topClientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.topClientes.map((c, i) => (
                <div key={c.nome} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{c.nome}</span>
                  <span className="text-xs text-muted-foreground">{c.qtd} OS</span>
                  <span className="font-bold text-money">{formatBRL(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-bold mb-3">Top 5 serviços</h3>
          {data.topServicos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2">
              {data.topServicos.map((s, i) => (
                <div key={s.nome} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-center font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{s.nome}</span>
                  <span className="text-xs text-muted-foreground">{s.qtd}x</span>
                  <span className="font-bold text-money">{formatBRL(s.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
