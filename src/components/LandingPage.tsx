import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wrench,
  CalendarDays,
  DollarSign,
  Package,
  BookOpen,
  MessageCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_GROUPS, CATEGORY_COLORS, type MainCategory } from "@/lib/service-categories";

// ─── Navbar ────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-bold text-xl shrink-0">
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          OficinaPRO
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition-colors">
            Funcionalidades
          </a>
          <a href="#planos" className="hover:text-foreground transition-colors">
            Planos
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden md:inline-flex px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/quiz"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
          >
            Diagnóstico
          </Link>
          <Link
            to="/cadastro"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── App Mockup ────────────────────────────────────────────────────────────

function AppMockup() {
  const columns = [
    {
      label: "Aguardando",
      color: "border-l-status-waiting bg-status-waiting/10",
      cards: ["Troca de óleo", "Revisão 30k"],
    },
    {
      label: "Em andamento",
      color: "border-l-status-progress bg-status-progress/10",
      cards: ["Alinhamento", "Freios dianteiros"],
    },
    {
      label: "Concluído",
      color: "border-l-status-done bg-status-done/10",
      cards: ["Funilaria lateral"],
    },
    {
      label: "Entregue",
      color: "border-l-status-delivered bg-status-delivered/10",
      cards: ["Insulfilm"],
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-xl border border-border shadow-2xl overflow-hidden bg-background">
      {/* Browser chrome */}
      <div className="bg-muted px-4 py-2.5 flex items-center gap-2 border-b border-border">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center">
          app.oficina.pro/os/kanban
        </div>
      </div>

      {/* Fake sidebar + content */}
      <div className="flex h-56 md:h-64">
        {/* Mini sidebar */}
        <div className="hidden sm:flex w-10 bg-sidebar border-r border-sidebar-border flex-col items-center py-3 gap-3">
          {[Wrench, CalendarDays, DollarSign, Package].map((Icon, i) => (
            <div key={i} className={cn("p-1.5 rounded-md", i === 0 ? "bg-sidebar-accent" : "")}>
              <Icon className="h-3.5 w-3.5 text-sidebar-foreground/70" />
            </div>
          ))}
        </div>

        {/* Kanban */}
        <div className="flex-1 p-3 overflow-hidden">
          <div className="flex gap-2 h-full">
            {columns.map((col) => (
              <div key={col.label} className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 truncate">
                  {col.label}
                </div>
                <div className="flex flex-col gap-1.5">
                  {col.cards.map((card) => (
                    <div
                      key={card}
                      className={cn(
                        "rounded-md border-l-2 px-1.5 py-1 text-[9px] font-medium",
                        col.color,
                      )}
                    >
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-28 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-6">
            <Zap className="h-3.5 w-3.5" />
            Para mecânicas, funilarias, elétricas e muito mais
          </span>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            O sistema completo para sua oficina <span className="text-primary">crescer</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            Ordens de serviço, agenda, financeiro, estoque e WhatsApp em uma única plataforma.
            Simples de usar, poderoso para qualquer especialidade.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/quiz"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Diagnóstico gratuito →
            </Link>
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Criar conta grátis
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Sem cartão de crédito · Configuração em 2 minutos
          </p>
        </div>

        <div className="lg:block">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────

function Stats() {
  const items = [
    { value: "OS + Kanban", label: "fluxo do chão de oficina" },
    { value: "Agenda → OS", label: "menos retrabalho no balcão" },
    { value: "Financeiro", label: "a receber e cobrança WA" },
    { value: "8+", label: "especialidades suportadas" },
  ];

  return (
    <div className="bg-primary text-primary-foreground py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <div className="font-display text-2xl md:text-3xl font-bold">{item.value}</div>
            <div className="text-sm text-primary-foreground/70 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Wrench,
    title: "Ordens de Serviço",
    description:
      "Crie, edite e acompanhe OS com kanban drag-and-drop. Histórico por veículo, PDF de orçamento e status atualizado na hora.",
  },
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    description:
      "Agende clientes por horário, visualize o dia com clareza e converta agendamentos em OS com dados pré-preenchidos.",
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description:
      "Recebíveis, fiado e datas de vencimento por OS. Cobranças e registros de pagamento sem sair do sistema.",
  },
  {
    icon: Package,
    title: "Estoque de Peças",
    description:
      "Vincule peças às OS com baixa automática, receba alertas de estoque mínimo e evite falta na hora do serviço.",
  },
  {
    icon: BookOpen,
    title: "Catálogo de Serviços",
    description:
      "Kit inicial de serviços ao criar a oficina. Adicione ao orçamento em segundos, com preço padrão.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp com 1 toque",
    description:
      "Orçamentos, atualizações de status, lembretes e cobranças abrem no WhatsApp prontos para enviar — sem digitar de novo.",
  },
];

function Features() {
  return (
    <section id="funcionalidades" className="py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Tudo que sua oficina precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            De mecânicas gerais a funilarias, estéticas e muito mais. Uma plataforma, todas as
            especialidades.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-background rounded-xl p-6 border border-border hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ──────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Crie sua conta grátis",
      body: "Cadastro em 2 minutos, sem cartão de crédito. Configure o nome da sua oficina e pronto.",
    },
    {
      num: "02",
      title: "Cadastre clientes e veículos",
      body: "Adicione seus clientes e veículos. O histórico completo de OS fica salvo automaticamente.",
    },
    {
      num: "03",
      title: "Emita OS e cresça",
      body: "Controle agenda, estoque e financeiro em um só lugar. Menos papelada, mais foco no serviço.",
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
          <p className="text-muted-foreground text-lg">
            Começar é simples. Em menos de 5 minutos você já está operando.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px bg-border" />
              )}
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-display font-bold text-xl mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Specialties ───────────────────────────────────────────────────────────

function Specialties() {
  return (
    <section className="py-20 bg-muted/40">
      <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Para todas as especialidades
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Não importa o nicho da sua oficina — o OficinaPRO foi feito para você.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          {CATEGORY_GROUPS.filter((g) => g.key !== "outros").map((g) => (
            <span
              key={g.key}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold",
                CATEGORY_COLORS[g.key as MainCategory],
              )}
            >
              {g.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────

type PlanFeature = { text: string; included: boolean };

type Plan = {
  name: string;
  price: string;
  period: string;
  highlight: boolean;
  badge?: string;
  cta: string;
  ctaVariant: "primary" | "outline";
  ctaHref: string;
  features: PlanFeature[];
};

const PLANS: Plan[] = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/ mês",
    highlight: false,
    cta: "Começar grátis",
    ctaVariant: "outline",
    ctaHref: "/cadastro",
    features: [
      { text: "Até 15 OS por mês", included: true },
      { text: "1 usuário", included: true },
      { text: "Clientes, veículos e OS", included: true },
      { text: "WhatsApp com 1 toque", included: true },
      { text: "Catálogo inicial de serviços", included: true },
      { text: "Agenda", included: false },
      { text: "Financeiro e estoque", included: false },
      { text: "Relatórios e equipe", included: false },
    ],
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/ mês",
    highlight: true,
    badge: "Mais popular",
    cta: "Começar no Pro →",
    ctaVariant: "primary",
    ctaHref: "/cadastro?plano=solo",
    features: [
      { text: "OS ilimitadas", included: true },
      { text: "Até 3 usuários", included: true },
      { text: "Agenda inteligente", included: true },
      { text: "Financeiro e estoque", included: true },
      { text: "Relatórios mensais", included: true },
      { text: "WhatsApp com templates", included: true },
      { text: "Playbook digital", included: true },
      { text: "Suporte por e-mail", included: true },
    ],
  },
  {
    name: "Oficina Plus",
    price: "R$ 197",
    period: "/ mês",
    highlight: false,
    cta: "Começar no Plus →",
    ctaVariant: "outline",
    ctaHref: "/cadastro?plano=oficina",
    features: [
      { text: "Tudo do plano Pro", included: true },
      { text: "Usuários ilimitados", included: true },
      { text: "Logo e marca na OS/PDF", included: true },
      { text: "Suporte prioritário", included: true },
      { text: "Onboarding assistido", included: true },
      { text: "Exportação de relatórios", included: true },
    ],
  },
];

function Pricing() {
  return (
    <section id="planos" className="py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Comece de graça e evolua conforme sua oficina cresce.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl border p-8 flex flex-col",
                plan.highlight
                  ? "border-primary shadow-lg shadow-primary/10 bg-background relative"
                  : "border-border bg-background",
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold rounded-full px-3 py-1">
                    <Star className="h-3 w-3" /> {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                    )}
                    <span className={f.included ? "text-foreground" : "text-muted-foreground"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastro"
                search={
                  plan.ctaHref.includes("solo")
                    ? { plano: "solo" }
                    : plan.ctaHref.includes("oficina")
                      ? { plano: "oficina" }
                      : undefined
                }
                className={cn(
                  "w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors",
                  plan.ctaVariant === "primary"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-muted",
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sem fidelidade — cancele quando quiser. Upgrade a qualquer momento em Ajustes.
        </p>
      </div>
    </section>
  );
}

// ─── Testimonials ──────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      "Antes eu controlava tudo em papel. Hoje sei exatamente o que entra e o que sai, quantas OS estão abertas e quanto vou receber no mês. Não abro mão.",
    name: "Carlos M.",
    role: "Mecânico há 15 anos",
  },
  {
    quote:
      "A agenda acabou com o problema de cliente sem hora marcada. Minha funilaria ficou muito mais organizada e o índice de faltas caiu pela metade.",
    name: "Fernanda R.",
    role: "Proprietária de funilaria",
  },
  {
    quote:
      "Mando o orçamento pelo WhatsApp com um toque e o cliente responde na hora. Profissionaliza o atendimento sem complicar.",
    name: "João P.",
    role: "Eletricista automotivo",
  },
];

function Testimonials() {
  return (
    <section className="py-24 bg-muted/40">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Oficinas que já transformaram seu negócio
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-background rounded-xl border border-border p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          * Depoimentos ilustrativos — substitua por avaliações reais dos seus clientes.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Precisa instalar algum programa?",
    a: "Não. O OficinaPRO é 100% online — funciona em qualquer navegador, no computador, celular ou tablet. Sem instalação, sem atualização manual.",
  },
  {
    q: "Funciona no celular e tablet?",
    a: "Sim. A interface é responsiva e foi projetada para uso mobile. Você pode criar OS, consultar a agenda e mandar mensagens pelo WhatsApp diretamente do celular.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Utilizamos a infraestrutura da Supabase, com banco de dados PostgreSQL criptografado, autenticação segura e backups automáticos. Seus dados são seus.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem fidelidade mínima. Você cancela quando quiser e continua com acesso até o fim do período pago.",
  },
  {
    q: "Tem período de teste gratuito?",
    a: "Sim. O plano Gratuito não tem prazo de expiração — use para conhecer o sistema. Quando precisar de agenda, financeiro e estoque, faça upgrade para o Pro.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
        </div>

        <div className="space-y-2">
          {FAQS.map((item, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left hover:bg-muted transition-colors"
              >
                {item.q}
                {open === i ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer CTA ────────────────────────────────────────────────────────────

function FooterCTA() {
  return (
    <section className="bg-primary text-primary-foreground py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <Shield className="h-10 w-10 mx-auto mb-4 opacity-80" />
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Comece hoje e transforme sua oficina
        </h2>
        <p className="text-primary-foreground/70 text-lg mb-8">
          Plano gratuito sem prazo de expiração. Sem cartão de crédito.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/quiz"
            className="inline-flex items-center px-8 py-4 text-base font-bold rounded-xl bg-background text-foreground hover:bg-background/90 transition-colors shadow-lg"
          >
            Diagnóstico gratuito
          </Link>
          <Link
            to="/cadastro"
            className="inline-flex items-center px-8 py-4 text-base font-bold rounded-xl border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-muted/60 border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <div className="bg-primary rounded-md p-1">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          OficinaPRO
        </div>

        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition-colors">
            Funcionalidades
          </a>
          <a href="#planos" className="hover:text-foreground transition-colors">
            Planos
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <Link to="/login" className="hover:text-foreground transition-colors">
            Entrar
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          Feito para oficinas brasileiras 🇧🇷 · © {new Date().getFullYear()} OficinaPRO
        </p>
      </div>
    </footer>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="scroll-smooth">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Specialties />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FooterCTA />
      <Footer />
    </div>
  );
}
