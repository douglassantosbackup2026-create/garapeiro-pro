import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const DURATION_MS = 12 * 60 * 1000; // 12 min

function formatMmSs(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function OfferCountdown() {
  const [remaining, setRemaining] = useState(DURATION_MS);

  useEffect(() => {
    const endsAt = Date.now() + DURATION_MS;
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive">
      <Clock className="size-4 shrink-0" aria-hidden />
      Oferta expira em {formatMmSs(remaining)}
    </div>
  );
}
