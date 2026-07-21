import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MoreVertical, Phone, Video } from "lucide-react";
import { testimonials, type ChatBubble } from "@/funil/data/testimonials";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "default" | "compact";
  className?: string;
  title?: string;
  subtitle?: string;
};

const AUTO_MS = 6500;

function initials(name: string) {
  return name
    .replace(/·.*/, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function Bubble({ msg }: { msg: ChatBubble }) {
  if (msg.kind === "money") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#dcf8c6] px-3 py-2 shadow-sm ring-1 ring-black/5">
          <p className="text-[13px] font-bold leading-snug text-emerald-900">
            {msg.text}
          </p>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-emerald-900/60">
            <span>{msg.time}</span>
            <span className="inline-flex -space-x-1 text-sky-500">
              <Check className="size-3" strokeWidth={3} />
              <Check className="size-3" strokeWidth={3} />
            </span>
          </div>
        </div>
      </div>
    );
  }
  const isOut = msg.kind === "out";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-1.5 shadow-sm ring-1 ring-black/5",
          isOut
            ? "rounded-2xl rounded-br-md bg-[#dcf8c6]"
            : "rounded-2xl rounded-bl-md bg-white",
        )}
      >
        <p className="text-[13px] leading-snug text-slate-800">{msg.text}</p>
        <div
          className={cn(
            "mt-0.5 flex items-center gap-1 text-[10px] text-slate-500",
            isOut ? "justify-end" : "justify-start",
          )}
        >
          <span>{msg.time}</span>
          {isOut && (
            <span className="inline-flex -space-x-1 text-sky-500">
              <Check className="size-3" strokeWidth={3} />
              <Check className="size-3" strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppTestimonials({
  variant = "default",
  className,
  title = "Mecânicos aplicando o Método agora",
  subtitle = "Conversas reais compartilhadas no nosso WhatsApp",
}: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = testimonials[index];

  return (
    <section className={cn("space-y-3", className)} aria-label="Depoimentos">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Prova social
          </p>
          <h3 className="font-display text-base font-bold leading-tight text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
            }
            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-muted"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className={cn(
          "overflow-hidden rounded-[1.75rem] border-[6px] border-foreground/90 bg-[#075e54] shadow-xl",
        )}
        role="group"
        aria-roledescription="carousel"
      >
        {/* WhatsApp header */}
        <div className="flex items-center gap-2.5 bg-[#075e54] px-3 py-2 text-white">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
              active.avatarColor,
            )}
            aria-hidden
          >
            {initials(active.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {active.name}
            </p>
            <p className="truncate text-[10px] text-white/70">
              online · {active.city}
            </p>
          </div>
          <Video className="size-4 text-white/80" />
          <Phone className="size-4 text-white/80" />
          <MoreVertical className="size-4 text-white/80" />
        </div>

        {/* Chat area */}
        <div
          key={active.id}
          className="whatsapp-chat-bg animate-pop space-y-1.5 px-3 py-3"
          aria-live="polite"
          style={{
            backgroundColor: "#ece5dd",
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            minHeight: variant === "compact" ? 240 : 320,
          }}
        >
          {active.messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {testimonials.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir para depoimento ${i + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40",
            )}
          />
        ))}
      </div>

      <p className="text-center text-[10px] leading-snug text-muted-foreground">
        Depoimentos compartilhados com autorização · nomes e avatares ilustrativos.
      </p>
    </section>
  );
}