import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { backgroundMusic } from "@/funil/lib/backgroundMusic";
import { cn } from "@/lib/utils";

/** Mute/unmute da música de fundo (pós-landing). */
export function MusicToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(() => backgroundMusic.isMuted());

  function handleToggle() {
    const next = backgroundMusic.toggleMuted();
    setMuted(next);
    if (!next && !backgroundMusic.isPlaying()) {
      void backgroundMusic.start();
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted",
        className,
      )}
      aria-label={muted ? "Ativar música" : "Silenciar música"}
      title={muted ? "Ativar música" : "Silenciar música"}
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}
