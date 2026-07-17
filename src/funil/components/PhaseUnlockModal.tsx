type Props = {
  open: boolean;
  onClose: () => void;
};

export function PhaseUnlockModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phase-unlock-title"
      onClick={onClose}
    >
      <div
        className="animate-pop w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="phase-unlock-title"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          Diagnóstico iniciado
        </h2>
        <p className="mt-3 text-base font-semibold text-foreground">
          Responda com sinceridade — em 60 segundos.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Cada resposta mostra quanto dinheiro sua oficina está deixando na
          mesa — em aquisição, retorno de cliente e faturamento.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:brightness-105"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
