import { Bell, Rocket, Shield, Sparkles, Star } from "lucide-react";
import { BrandHeader, Shell } from "./BrandHeader";
import { useFunnel } from "@/funil/funnel/FunnelContext";

const NICHES = [
  "Mecânica",
  "Elétrica e Tecnologia",
  "Funilaria e Pintura",
  "Estética Automotiva",
  "Pneus e Rodas",
  "Vidros e Acessórios",
  "Performance e Customização",
] as const;

const NOTIFICATIONS = [
  { title: "Serviço aprovado", time: "Agora", amount: "R$ 1.240" },
  { title: "Novo orçamento", time: "há 2 min", amount: "R$ 890" },
  { title: "Recuperado (follow-up)", time: "há 8 min", amount: "R$ 2.100" },
  { title: "Serviço aprovado", time: "há 12 min", amount: "R$ 480" },
  { title: "Cliente retornou", time: "há 18 min", amount: "R$ 1.560" },
  { title: "Upsell fluidos", time: "há 22 min", amount: "R$ 320" },
  { title: "Parceria postou", time: "há 35 min", amount: "R$ 1.890" },
  { title: "OS finalizada", time: "há 41 min", amount: "R$ 970" },
  { title: "Orçamento fechado", time: "há 55 min", amount: "R$ 3.450" },
  { title: "Revisão agendada", time: "há 1 h", amount: "R$ 650" },
] as const;

/** Duplicado para loop contínuo tipo GIF */
const SCROLL_ITEMS = [...NOTIFICATIONS, ...NOTIFICATIONS];

export function Landing() {
  const { dispatch } = useFunnel();

  return (
    <Shell>
      <BrandHeader className="mb-8" socialProof compact />

      <section className="animate-pop flex flex-1 flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" />
          Diagnóstico gratuito
        </div>

        <h1 className="font-display text-[1.65rem] font-bold leading-[1.25] tracking-tight text-foreground sm:text-3xl">
          Descubra por que algumas oficinas fazem{" "}
          <span className="inline rounded-md bg-primary px-1.5 py-0.5 text-primary-foreground">
            R$ 20.000/mês
          </span>{" "}
          — enquanto outras mal conseguem clientes. E como mudar isso em até 30 dias.
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Mesmo que você esteja começando do zero, sem equipe e sem gastar com
          anúncios caros.
        </p>

        <div className="mt-5 max-w-md space-y-3 text-left text-sm leading-relaxed text-foreground">
          <p>
            Se você tem uma oficina — ou quer montar uma — deixa eu te fazer uma
            pergunta rápida: por que alguns mecânicos vivem cheios de clientes
            enquanto outros ficam olhando o portão vazio o dia inteiro?
          </p>
          <p className="font-semibold text-foreground">
            Não é sorte. Não é localização. E não é “ter o melhor serviço”.
          </p>
          <p className="rounded-xl border border-primary/30 bg-accent px-3 py-3 text-foreground">
            Existe um <span className="font-bold text-primary">sistema previsível</span>{" "}
            que transforma qualquer oficina comum em uma máquina de atrair
            clientes — novos e antigos — todos os dias.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {NICHES.map((niche) => (
            <span
              key={niche}
              className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              {niche}
            </span>
          ))}
        </div>

        <div className="relative mt-8 w-full max-w-[280px]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-primary/15 blur-2xl"
            aria-hidden
          />
          <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-foreground/90 bg-card shadow-xl">
            <div className="flex items-center justify-center border-b border-border bg-muted/50 py-2">
              <div className="h-1.5 w-16 rounded-full bg-foreground/20" />
            </div>
            <div className="phone-notify-viewport" aria-hidden>
              <ul className="phone-notify-track space-y-2.5 p-3 text-left">
                {SCROLL_ITEMS.map((n, i) => (
                  <li
                    key={`${n.title}-${n.time}-${i}`}
                    className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-background px-2.5 py-2 shadow-sm"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Bell className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{n.time}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-money">
                      {n.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full max-w-md space-y-4 text-left">
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-destructive">
              A maioria das oficinas hoje…
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              <li>✕ Depende de indicação (e sofre quando ela para)</li>
              <li>✕ Perde clientes antigos sem nem perceber</li>
              <li>✕ Não sabe atrair cliente novo de forma constante</li>
              <li className="font-semibold">
                E o pior: acha que isso é normal.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-money/30 bg-money/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-money">
              Com o Método Oficina PRO você aprende a:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-foreground">
              <li>✓ Atrair clientes novos todos os dias</li>
              <li>✓ Trazer de volta clientes que já sumiram</li>
              <li>✓ Criar um fluxo constante de faturamento</li>
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            dispatch({ type: "START" });
          }}
          className="mt-6 flex w-full max-w-md flex-col items-center justify-center gap-0.5 rounded-xl bg-primary px-6 py-4 text-primary-foreground shadow-md transition hover:brightness-105 active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
            <Rocket className="size-5" />
            Descobrir quanto minha oficina pode faturar
          </span>
          <span className="text-xs font-medium text-primary-foreground/80">
            Teste gratuito · cerca de 60 segundos
          </span>
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Shield className="size-3.5 text-primary" />
            Garantia 7 dias no Método
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 text-primary" />
            Para mecânica, funilaria, elétrica e mais
          </span>
        </div>

        <p className="mt-10 text-[11px] text-muted-foreground">
          © 2026 OficinaPRO · oficinapro.com.br
        </p>
      </section>
    </Shell>
  );
}
