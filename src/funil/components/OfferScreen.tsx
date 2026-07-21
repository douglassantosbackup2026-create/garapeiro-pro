import { Check, BookOpen, Gift, ShieldCheck } from "lucide-react";
import {
  formatTotalCents,
  mainOffer,
  orderBumps,
  saasTrialBonus,
  type OfferId,
} from "@/funil/data/offers";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { BrandHeader, Shell } from "./BrandHeader";
import { LossCalculator } from "./LossCalculator";
import { OfferCountdown } from "./OfferCountdown";
import { WhatsAppTestimonials } from "./WhatsAppTestimonials";
import { cn } from "@/lib/utils";

const MAIN_BULLETS = [
  "Como atrair clientes sem depender só de indicação",
  "Como recuperar orçamentos que esfriaram no Zap",
  "Como fazer o cliente voltar (sem implorar)",
  "Como cobrar melhor sem perder serviço",
  "Rotinas práticas — sem virar “gente de marketing”",
] as const;

const AGITATION = [
  "Depende de indicação — e sofre quando ela para",
  "Trabalha o dia inteiro e no fim do mês sobra pouco",
  "Cliente some depois do orçamento",
  "Preço sempre pressionado pela concorrência",
] as const;

export function OfferScreen() {
  const { state, dispatch, selectedOfferIds, goToCheckout } = useFunnel();

  const totalCents =
    mainOffer.priceCents +
    orderBumps
      .filter((b) => state.selectedBumps.includes(b.id))
      .reduce((sum, b) => sum + b.priceCents, 0);

  function toggle(id: OfferId) {
    if (id === "playbook") return;
    dispatch({ type: "TOGGLE_BUMP", id });
  }

  return (
    <Shell>
      <BrandHeader className="mb-6" socialProof />

      <section className="animate-pop space-y-5 pb-28">
        <div>
          <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            Com base no seu diagnóstico
          </span>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">
            Se sua oficina depende de indicação… você está jogando o jogo errado
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Oficina que fatura de forma previsível não espera o cliente da rua —
            ela atrai, cobra e faz voltar com método.
          </p>
        </div>

        <OfferCountdown />

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Reconhece isso?
          </p>
          <ul className="mt-3 space-y-2">
            {AGITATION.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="text-destructive" aria-hidden>
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-accent/50 p-4 text-sm leading-relaxed">
          <p className="font-display font-bold text-foreground">Faz a conta:</p>
          <p className="mt-2 text-muted-foreground">
            3 clientes novos por dia × ticket médio de R$&nbsp;150 × 20 dias ={" "}
            <span className="font-bold text-foreground">R$&nbsp;9.000</span>
          </p>
          <p className="mt-2 text-muted-foreground">
            Some clientes antigos voltando e orçamentos recuperados — chegar perto
            de R$&nbsp;10–20&nbsp;mil deixa de ser sonho e vira matemática. O Método
            mostra o caminho; o resto é execução.
          </p>
        </div>

        <LossCalculator />

        <WhatsAppTestimonials
          title="Quem já está faturando com o Método"
          subtitle="Prints reais que os alunos mandam pra gente"
        />

        <article className="rounded-2xl border-2 border-primary bg-card p-5 shadow-md">
          <div className="mb-1">
            <span className="inline-block rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Método OficinaPRO
            </span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight">
                  {mainOffer.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {mainOffer.subtitle}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {mainOffer.description}
          </p>
          <ul className="mt-4 space-y-2">
            {MAIN_BULLETS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-money" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-sm text-muted-foreground line-through">
              De R$&nbsp;197
            </span>
            <p className="font-display text-2xl font-bold text-primary">
              {mainOffer.priceLabel}
            </p>
            <span className="pb-0.5 text-xs text-muted-foreground">à vista</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Pagamento único · sem mensalidade do material · garantia 7 dias
          </p>
        </article>

        <div className="flex gap-3 rounded-2xl border border-money/40 bg-money/10 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-money text-money-foreground">
            <Gift className="size-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-foreground">
              {saasTrialBonus.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {saasTrialBonus.description}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-display mb-3 text-sm font-bold text-foreground">
            Turbine seu resultado — adicione ao pedido:
          </h3>
          <ul className="space-y-3">
            {orderBumps.map((bump) => {
              const on = state.selectedBumps.includes(bump.id);
              return (
                <li key={bump.id}>
                  <button
                    type="button"
                    onClick={() => toggle(bump.id)}
                    className={cn(
                      "flex w-full gap-3 rounded-xl border p-4 text-left transition",
                      on
                        ? "border-money/50 bg-money/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                        on
                          ? "border-money bg-money text-money-foreground"
                          : "border-border bg-background",
                      )}
                      aria-hidden
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {bump.badge ?? "Mini adicional"}
                          </span>
                          <p className="font-display text-sm font-bold">
                            {bump.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {bump.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold">
                          + {bump.priceLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {bump.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="rounded-xl border border-border bg-muted/40 p-3 text-center text-xs leading-relaxed text-muted-foreground">
          Se você quer continuar reclamando do movimento e trabalhando muito pra
          ganhar pouco — pode sair agora. Se quer previsibilidade, o próximo passo
          é começar.
        </p>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-money" />
            Pagamento único
          </span>
          <span>· Acesso imediato</span>
          <span>· Garantia 7 dias</span>
        </p>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Total · {selectedOfferIds.length} item
              {selectedOfferIds.length > 1 ? "s" : ""}
            </p>
            <p className="font-display text-xl font-bold">
              {formatTotalCents(totalCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => goToCheckout()}
            className="rounded-xl bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md transition hover:brightness-105"
          >
            Começar agora →
          </button>
        </div>
      </div>
    </Shell>
  );
}
