import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { formatBRL } from "@/funil/lib/sessionMoney";
import type { MoneyToastPayload } from "@/funil/funnel/FunnelContext";
import { cn } from "@/lib/utils";

type ToastItem = MoneyToastPayload & { leaving?: boolean };

type Props = {
  pending: MoneyToastPayload | null;
  onConsumed: () => void;
};

const DISPLAY_MS = 3200;
const EXIT_MS = 320;

export function MoneyToastStack({ pending, onConsumed }: Props) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!pending) return;
    const toast = pending;
    setItems((prev) => [...prev, toast]);
    onConsumed();

    window.setTimeout(() => {
      setItems((prev) =>
        prev.map((t) => (t.id === toast.id ? { ...t, leaving: true } : t)),
      );
    }, DISPLAY_MS);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== toast.id));
    }, DISPLAY_MS + EXIT_MS);
  }, [pending, onConsumed]);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-3 z-[60] mx-auto flex w-full max-w-lg flex-col gap-2 px-3"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-[22px] border border-border bg-card/95 px-3.5 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl",
            t.leaving ? "animate-money-toast-out" : "animate-money-toast-in",
          )}
        >
          <div
            className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-money text-money-foreground"
            aria-hidden
          >
            <Wrench className="size-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold leading-snug text-foreground">
                {t.title}
              </p>
              <span className="shrink-0 pt-0.5 text-[11px] font-medium text-muted-foreground">
                {t.timeLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              Você recuperou{" "}
              <span className="font-semibold text-money">
                {formatBRL(t.cents)}
              </span>{" "}
              no diagnóstico
              {t.fromName ? ` · ${t.fromName}` : ""}. Continua somando.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
