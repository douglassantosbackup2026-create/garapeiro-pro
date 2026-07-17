import { useState } from "react";
import { ArrowRight, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { formatBRL } from "@/funil/lib/sessionMoney";
import { BonusUnlockModal } from "./BonusUnlockModal";
import { BrandHeader, Shell } from "./BrandHeader";
import { cn } from "@/lib/utils";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function maskWhatsapp(digits: string) {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const GAP_LABELS: Record<string, string> = {
  clientes: "Falta de aquisição previsível (dependência de indicação)",
  orcamentos: "Nenhum sistema pronto pra atrair cliente todos os dias",
  ticket: "Faturamento travado — sem ticket e volume pra crescer",
  retorno: "Clientes antigos que somem sem lembrete de retorno",
  organizacao: "Não tem noção do quanto poderia estar faturando",
  tempo: "Dia a dia engolindo o dono — sem estratégia clara",
};

export function ResultScreen() {
  const { state, diagnosis, dispatch, submitLead } = useFunnel();
  const { profile, strategies, totalScore, maxScore, weakCategories } = diagnosis;
  const pct = Math.round((totalScore / maxScore) * 100);
  const [showBonusModal, setShowBonusModal] = useState(true);
  const [showLead, setShowLead] = useState(!state.lead);
  const [name, setName] = useState(state.lead?.name ?? "");
  const [whatsapp, setWhatsapp] = useState(
    state.lead?.whatsapp ? maskWhatsapp(state.lead.whatsapp) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gaps = weakCategories.slice(0, 3).map((id) => GAP_LABELS[id] ?? id);

  async function continueToOffer() {
    if (state.lead) {
      dispatch({ type: "TO_OFFER" });
      return;
    }
    setShowLead(true);
    const digits = onlyDigits(whatsapp);
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (digits.length < 10) {
      setError("Informe um WhatsApp válido com DDD.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitLead(
        {
          name: name.trim(),
          whatsapp: digits,
          email: "",
          createdAt: new Date().toISOString(),
        },
        "result",
      );
      dispatch({ type: "TO_OFFER" });
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <BonusUnlockModal
        open={showBonusModal}
        onClose={() => setShowBonusModal(false)}
      />

      <BrandHeader className="mb-6" />

      <section className="animate-pop space-y-6">
        <div
          className={cn(
            "rounded-2xl border p-5 shadow-sm",
            profile.accent === "money"
              ? "border-money/30 bg-money/10"
              : "border-primary/30 bg-accent",
          )}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            No diagnóstico você já “recuperou”{" "}
            <span className="font-bold text-money">
              {formatBRL(state.earningsCents)}
            </span>{" "}
            (simulado)
          </p>

          <p className="mb-3 flex items-start gap-2 text-sm font-semibold leading-snug text-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
            Seu diagnóstico: pelas suas respostas, sua oficina tem potencial
            pra faturar entre R$ 5.000 e R$ 20.000 por mês — mas está deixando
            dinheiro na mesa todos os dias.
          </p>

          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {profile.headline}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {profile.description}
          </p>

          {gaps.length > 0 && (
            <ul className="mt-4 space-y-2 rounded-xl border border-border/60 bg-background/60 p-3">
              <li className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Hoje você está limitado por:
              </li>
              {gaps.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-destructive" aria-hidden>
                    ✕
                  </span>
                  {g}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-3">
            <div className="relative size-14">
              <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className={
                    profile.accent === "money" ? "stroke-money" : "stroke-primary"
                  }
                  strokeWidth="3"
                  strokeDasharray={`${pct} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {pct}%
              </span>
            </div>
            <div>
              <p className="font-display text-sm font-bold">{profile.title}</p>
              <p className="text-xs text-muted-foreground">
                {profile.opportunityLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-money/30 bg-money/10 p-4 text-sm leading-relaxed text-foreground">
          <p className="font-semibold">A boa notícia?</p>
          <p className="mt-1 text-muted-foreground">
            Isso não depende de sorte, nem de investir alto em anúncio. Depende
            de um método simples pra atrair cliente todo dia, recuperar quem
            sumiu e fazer o faturamento subir — foi exatamente pra isso que
            criamos o <span className="font-bold text-foreground">Método
            Oficina PRO</span>.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h2 className="font-display text-lg font-bold">
              Prioridades do Método pra você
            </h2>
          </div>
          <ul className="space-y-3">
            {strategies.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="mb-1 flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-money" />
                  <p className="text-sm font-semibold text-foreground">
                    {s.title}
                  </p>
                </div>
                <p className="pl-6 text-sm leading-relaxed text-muted-foreground">
                  {s.summary}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {showLead && !state.lead && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">
                Pra ver o método do seu diagnóstico, deixe seu WhatsApp
              </p>
              <p className="text-xs text-muted-foreground">
                Assim conseguimos te avisar se a oferta expirar ou se você sair
                no meio.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                autoComplete="name"
              />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                placeholder="(11) 99999-0000"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                autoComplete="tel"
                inputMode="numeric"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          <button
            type="button"
            onClick={() => void continueToOffer()}
            disabled={busy}
            className="group flex w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-md transition hover:brightness-105 disabled:opacity-60"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              {busy ? "Salvando..." : "Ver o método do meu diagnóstico"}
              {!busy && (
                <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
              )}
            </span>
            <span className="text-xs font-medium text-primary-foreground/80">
              Próximo: oferta com base nas suas respostas
            </span>
          </button>
        </div>
      </section>
    </Shell>
  );
}
