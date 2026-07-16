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
        <p className="text-2xl" aria-hidden>
          🔓
        </p>
        <h2
          id="phase-unlock-title"
          className="font-display mt-2 text-xl font-bold tracking-tight text-foreground"
        >
          FASE 1 DESBLOQUEADA
        </h2>
        <p className="mt-3 text-base font-semibold text-foreground">
          Você começou. 🚀
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A maioria nem chega aqui.
          <br />
          Cada passo certo = recompensa 💰
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
