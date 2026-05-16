import { Link, Outlet, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "@/hooks/useWorkshop";
import { useSmartAlerts } from "@/hooks/useSmartAlerts";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "@tanstack/react-router";

const NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/os", label: "Ordens", icon: Wrench },
  { to: "/os/kanban", label: "Painel", icon: KanbanSquare },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/estoque", label: "Estoque", icon: Package },
  { to: "/servicos", label: "Catálogo", icon: BookOpen },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
];

function isActive(path: string, current: string, exact = false) {
  if (exact) return current === path;
  return current === path || current.startsWith(path + "/");
}

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, session, profile, signOut } = useAuth();

  const PUBLIC = ["/login", "/cadastro", "/recuperar-senha", "/reset-password"];
  const isPublic = PUBLIC.includes(pathname) || pathname.startsWith("/convite/");
  const isOnboarding = pathname === "/onboarding";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (isPublic) return <Outlet />;

  if (pathname === "/" && !session) return <Outlet />;

  if (!session) return <Navigate to="/login" />;
  if (!profile?.workshop_id && !isOnboarding) return <Navigate to="/onboarding" />;
  if (isOnboarding) return <Outlet />;

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

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            {workshop?.logo_url ? (
              <img
                src={workshop.logo_url}
                alt={workshop.nome ?? "Logo"}
                className="h-9 w-9 rounded-md object-cover bg-sidebar-accent"
              />
            ) : (
              <div className="bg-primary rounded-md p-1.5">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
            <div>
              <div className="font-display font-bold text-lg leading-none">MecânicoPRO</div>
              <div className="text-xs text-sidebar-foreground/60 mt-0.5">
                {workshop?.nome ?? "Oficina"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2">
          {NAV.map((item) => {
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
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/alertas"
          className="m-2 flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm bg-sidebar-accent/40 hover:bg-sidebar-accent text-sidebar-foreground"
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
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary text-secondary-foreground border-t border-border h-16 grid grid-cols-5">
        {NAV.filter((i) => ["/", "/agenda", "/os", "/financeiro", "/configuracoes"].includes(i.to)).map((item) => {
          const active = isActive(item.to, pathname, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as string}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-secondary-foreground/60"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}