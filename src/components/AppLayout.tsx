import { Link, Outlet, useRouterState, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home,
  Wrench,
  Car,
  Users,
  Settings,
  Bell,
  KanbanSquare,
  DollarSign,
  Package,
  BarChart3,
  LogOut,
  CalendarDays,
  BookOpen,
  BookMarked,
  MoreHorizontal,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "@/hooks/useWorkshop";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useAuth } from "@/hooks/useAuth";
import { featureForPath, normalizePlano, planHasFeature, PLANS } from "@/lib/plans";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

const NAV: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  playbookOnly?: boolean;
}[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/os", label: "Ordens", icon: Wrench, exact: true },
  { to: "/os/kanban", label: "Painel", icon: KanbanSquare },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/servicos", label: "Catálogo", icon: BookOpen },
  { to: "/playbook", label: "Playbook", icon: BookMarked, playbookOnly: true },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
];

const MOBILE_PRIMARY = ["/", "/agenda", "/os", "/financeiro"] as const;

function isActive(path: string, current: string, exact = false) {
  if (exact) return current === path;
  if (path === "/os") {
    return current === "/os" || (current.startsWith("/os/") && !current.startsWith("/os/kanban"));
  }
  return current === path || current.startsWith(path + "/");
}

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session, profile, profileError, refreshProfile, signOut } = useAuth();
  const [retryingProfile, setRetryingProfile] = useState(false);

  const PUBLIC = ["/login", "/cadastro", "/recuperar-senha", "/reset-password", "/quiz"];
  const isPublic = PUBLIC.includes(pathname) || pathname.startsWith("/convite/");
  const isOnboarding = pathname === "/onboarding";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (isPublic) {
    return (
      <AppErrorBoundary variant="section">
        <Outlet />
      </AppErrorBoundary>
    );
  }

  if (pathname === "/" && !session) {
    return (
      <AppErrorBoundary variant="section">
        <Outlet />
      </AppErrorBoundary>
    );
  }

  if (!session) return <Navigate to="/login" />;

  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Não foi possível carregar sua oficina
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profileError}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              disabled={retryingProfile}
              onClick={() => {
                setRetryingProfile(true);
                void refreshProfile().finally(() => setRetryingProfile(false));
              }}
            >
              {retryingProfile ? "Tentando..." : "Tentar novamente"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void signOut()}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.workshop_id && !isOnboarding) return <Navigate to="/onboarding" />;
  if (isOnboarding) {
    return (
      <AppErrorBoundary variant="section">
        <Outlet />
      </AppErrorBoundary>
    );
  }

  return <AuthedShell pathname={pathname} signOut={signOut} />;
}

type AuthedShellProps = {
  pathname: string;
  signOut: () => Promise<void>;
};

function AuthedShell({ pathname, signOut }: AuthedShellProps) {
  const { data: workshop } = useWorkshop();
  const { data: alerts } = useSmartAlerts();
  const alertCount = alerts?.length ?? 0;
  const playbookUnlocked = Boolean(workshop?.playbook_unlocked_at);
  const plano = normalizePlano(workshop?.plano);
  const navItems = NAV.filter((item) => !item.playbookOnly || playbookUnlocked);
  const [moreOpen, setMoreOpen] = useState(false);

  const gatedFeature = featureForPath(pathname);
  if (gatedFeature && workshop && !planHasFeature(plano, gatedFeature)) {
    return (
      <div className="min-h-screen w-full flex bg-background">
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <SidebarBrand workshop={workshop} />
          <DesktopNav navItems={navItems} pathname={pathname} plano={plano} />
          <SidebarFooter
            alertCount={alertCount}
            pathname={pathname}
            signOut={signOut}
          />
        </aside>
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <UpgradeGate feature={gatedFeature} plano={plano} />
        </main>
        <MobileBottomNav
          pathname={pathname}
          moreOpen={moreOpen}
          setMoreOpen={setMoreOpen}
          navItems={navItems}
          alertCount={alertCount}
          playbookUnlocked={playbookUnlocked}
          plano={plano}
          signOut={signOut}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <SidebarBrand workshop={workshop} />
        <DesktopNav navItems={navItems} pathname={pathname} plano={plano} />
        <SidebarFooter alertCount={alertCount} pathname={pathname} signOut={signOut} />
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <AppErrorBoundary variant="section">
          <Outlet />
        </AppErrorBoundary>
      </main>

      <MobileBottomNav
        pathname={pathname}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
        navItems={navItems}
        alertCount={alertCount}
        playbookUnlocked={playbookUnlocked}
        plano={plano}
        signOut={signOut}
      />
    </div>
  );
}

function SidebarBrand({
  workshop,
}: {
  workshop: { nome?: string | null; logo_url?: string | null } | undefined;
}) {
  return (
    <div className="p-5 border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        {workshop?.logo_url ? (
          <img
            src={workshop.logo_url}
            alt={workshop.nome ?? "Logo"}
            className="h-9 w-9 rounded-md object-cover bg-sidebar-accent"
            loading="lazy"
            width={36}
            height={36}
          />
        ) : (
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <div>
          <div className="font-display font-bold text-lg leading-none">OficinaPRO</div>
          <div className="text-xs text-sidebar-foreground/60 mt-0.5">
            {workshop?.nome ?? "Oficina"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopNav({
  navItems,
  pathname,
  plano,
}: {
  navItems: typeof NAV;
  pathname: string;
  plano: ReturnType<typeof normalizePlano>;
}) {
  return (
    <nav className="flex-1 p-2">
      {navItems.map((item) => {
        const feature = featureForPath(item.to);
        const locked = feature ? !planHasFeature(plano, feature) : false;
        const active = isActive(item.to, pathname, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to as string}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {locked && <Lock className="h-3.5 w-3.5 opacity-50" />}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  alertCount,
  pathname,
  signOut,
}: {
  alertCount: number;
  pathname: string;
  signOut: () => Promise<void>;
}) {
  return (
    <>
      <Link
        to="/alertas"
        className={cn(
          "m-2 flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm bg-sidebar-accent/40 hover:bg-sidebar-accent text-sidebar-foreground",
          isActive("/alertas", pathname) && "bg-sidebar-accent",
        )}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Alertas
        </div>
        {alertCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
            {alertCount}
          </span>
        )}
      </Link>
      <button
        onClick={() => signOut()}
        className="m-2 mt-0 flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="h-4 w-4" /> Sair
      </button>
    </>
  );
}

function UpgradeGate({
  feature,
  plano,
}: {
  feature: NonNullable<ReturnType<typeof featureForPath>>;
  plano: ReturnType<typeof normalizePlano>;
}) {
  const labels: Record<string, string> = {
    agenda: "Agenda",
    financeiro: "Financeiro",
    estoque: "Estoque",
    relatorios: "Relatórios",
  };
  return (
    <div className="px-4 md:px-8 py-16 max-w-lg mx-auto text-center space-y-4">
      <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold">{labels[feature] ?? feature} no plano {PLANS[plano].name}</h1>
      <p className="text-sm text-muted-foreground">
        Faça upgrade para o Pro (R$ 97/mês) e libere agenda, financeiro, estoque e relatórios.
      </p>
      <Button asChild>
        <Link to="/configuracoes" search={{ upgrade: "1" }}>
          Ver planos e fazer upgrade
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}

function MobileBottomNav({
  pathname,
  moreOpen,
  setMoreOpen,
  navItems,
  alertCount,
  playbookUnlocked,
  plano,
  signOut,
}: {
  pathname: string;
  moreOpen: boolean;
  setMoreOpen: (v: boolean) => void;
  navItems: typeof NAV;
  alertCount: number;
  playbookUnlocked: boolean;
  plano: ReturnType<typeof normalizePlano>;
  signOut: () => Promise<void>;
}) {
  const primary = NAV.filter((i) =>
    (MOBILE_PRIMARY as readonly string[]).includes(i.to),
  );
  const moreActive =
    moreOpen ||
    !primary.some((i) => isActive(i.to, pathname, i.exact)) ||
    pathname === "/alertas" ||
    pathname === "/configuracoes";

  const moreItems = [
    ...navItems.filter((i) => !(MOBILE_PRIMARY as readonly string[]).includes(i.to)),
    { to: "/alertas", label: "Alertas", icon: Bell },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary text-secondary-foreground border-t border-border h-16 grid grid-cols-5">
        {primary.map((item) => {
          const active = isActive(item.to, pathname, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as string}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-secondary-foreground/60",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors relative",
            moreActive ? "text-primary" : "text-secondary-foreground/60",
          )}
        >
          <MoreHorizontal className={cn("h-5 w-5", moreActive && "stroke-[2.5]")} />
          Mais
          {alertCount > 0 && (
            <span className="absolute top-1 right-3 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const feature = featureForPath(item.to);
              const locked = feature ? !planHasFeature(plano, feature) : false;
              if (item.to === "/playbook" && !playbookUnlocked) return null;
              return (
                <Link
                  key={item.to}
                  to={item.to as string}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted text-sm relative"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs text-center">{item.label}</span>
                  {item.to === "/alertas" && alertCount > 0 && (
                    <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                  {locked && <Lock className="h-3 w-3 absolute top-2 left-2 opacity-40" />}
                </Link>
              );
            })}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => {
              setMoreOpen(false);
              void signOut();
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
