import { useMemo, useState } from "react";
import { mainOffer } from "@/funil/data/offers";

const LEAK_RATE = 0.3;

function formatMoney(reais: number) {
  return reais.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function LossCalculator() {
  const [services, setServices] = useState(60);
  const [ticket, setTicket] = useState(350);

  const { monthLoss, yearLoss } = useMemo(() => {
    const month = Math.round(services * ticket * LEAK_RATE);
    return { monthLoss: month, yearLoss: month * 12 };
  }, [services, ticket]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Calculadora — quanto você deixa na mesa por mês
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Serviços / mês
          </span>
          <input
            type="number"
            min={1}
            max={9999}
            value={services}
            onChange={(e) => setServices(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Ticket médio (R$)
          </span>
          <input
            type="number"
            min={1}
            max={999999}
            value={ticket}
            onChange={(e) => setTicket(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">
            Você perde / mês
          </p>
          <p className="mt-1 font-display text-base font-bold text-destructive">
            {formatMoney(monthLoss)}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-destructive">
            Em 12 meses
          </p>
          <p className="mt-1 font-display text-base font-bold text-destructive">
            {formatMoney(yearLoss)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        O Método custa menos que{" "}
        <span className="font-semibold text-foreground">{mainOffer.priceLabel}</span>{" "}
        pra começar a recuperar isso.
      </p>
    </div>
  );
}
