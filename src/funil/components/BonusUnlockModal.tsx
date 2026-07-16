import { saasTrialBonus } from "@/funil/data/offers";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BonusUnlockModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bonus-unlock-title"
      onClick={onClose}
    >
      <div
        className="animate-pop w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-2xl" aria-hidden>
          🎁
        </p>
        <h2
          id="bonus-unlock-title"
          className="font-display mt-2 text-center text-xl font-bold tracking-tight text-primary"
        >
          BÔNUS LIBERADO!
        </h2>

        <p className="mt-4 text-sm font-bold text-foreground">
          🎁 {saasTrialBonus.days} dias grátis do OficinaPRO
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {saasTrialBonus.description}
        </p>

        <div className="mt-4 rounded-xl border border-border bg-muted/60 px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-foreground">
            No sistema você vai:
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• organizar OS, agenda e clientes num só lugar</li>
            <li>• acompanhar financeiro sem planilha</li>
            <li>• colocar o Método em prática na oficina</li>
          </ul>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          🔥 Liberado junto com o Método pra transformar o diagnóstico em{" "}
          <span className="font-semibold text-money">faturamento previsível</span>.
        </p>
        <p className="mt-3 rounded-xl border border-money/25 bg-money/10 px-3 py-2.5 text-sm font-semibold leading-relaxed text-money">
          🎁 Ao adquirir o Método, você ativa {saasTrialBonus.days} dias grátis do
          sistema — sem custo extra.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:brightness-105"
        >
          🔥 Quero meu plano com bônus
        </button>
      </div>
    </div>
  );
}
