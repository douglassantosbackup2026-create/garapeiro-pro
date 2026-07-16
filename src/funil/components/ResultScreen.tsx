import { useState } from "react";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { formatBRL } from "@/funil/lib/sessionMoney";
import { BonusUnlockModal } from "./BonusUnlockModal";
import { BrandHeader, Shell } from "./BrandHeader";
import { cn } from "@/lib/utils";

export function ResultScreen() {
  const { state, diagnosis, dispatch } = useFunnel();
  const { profile, strategies, totalScore, maxScore } = diagnosis;
  const pct = Math.round((totalScore / maxScore) * 100);
  const [showBonusModal, setShowBonusModal] = useState(true);

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
            Você já recuperou no diagnóstico{" "}
            <span className="font-bold text-money">
              {formatBRL(state.earningsCents)}
            </span>
          </p>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Isso é só o simulado respondendo. O Método transforma em rotina na
            oficina.
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {profile.headline}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {profile.description}
          </p>
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

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <h2 className="font-display text-lg font-bold">
              Prioridades do Método
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
          <p className="text-center text-sm text-muted-foreground">
            Próximo passo: liberar o Método com base neste diagnóstico.
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "TO_OFFER" })}
            className="group flex w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-md transition hover:brightness-105"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              Quero aplicar o Método agora
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
            </span>
            <span className="text-xs font-medium text-primary-foreground/80">
              Desbloquear plano completo
            </span>
          </button>
        </div>
      </section>
    </Shell>
  );
}
