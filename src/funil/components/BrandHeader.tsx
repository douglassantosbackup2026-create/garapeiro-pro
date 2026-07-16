import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandHeaderProps = {
  className?: string;
  /** Badge de prova social à direita (landing) */
  socialProof?: boolean;
  /** Esconde o subtítulo “Diagnóstico…” */
  compact?: boolean;
};

export function BrandHeader({
  className,
  socialProof = false,
  compact = false,
}: BrandHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-2",
        socialProof && "justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Wrench className="size-4" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            OficinaPRO
          </p>
          {!compact && (
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Diagnóstico da oficina
            </p>
          )}
        </div>
      </div>

      {socialProof && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="max-w-[9.5rem] leading-tight sm:max-w-none">
            128 oficinas aplicando agora
          </span>
        </div>
      )}
    </header>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-10 pt-5 sm:px-6">
      {children}
    </div>
  );
}
