type Props = {
  open: boolean;
  onClose: () => void;
};

export function DecisionMomentModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-moment-title"
      onClick={onClose}
    >
      <div
        className="animate-pop w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="decision-moment-title"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          Agora não é curiosidade.
          <br />
          É decisão.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Você já viu o padrão: indicação some, orçamento esfria, cliente não
          volta. O próximo passo é descobrir o que travar o seu faturamento —
          e o que fazer a respeito.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:brightness-105"
        >
          Continuar o diagnóstico
        </button>
      </div>
    </div>
  );
}
