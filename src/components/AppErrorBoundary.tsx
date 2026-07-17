import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "@/lib/reportError";

type Props = {
  children: ReactNode;
  /** When true, use compact layout (inside shell). Default: full-page. */
  variant?: "page" | "section";
};

type State = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, "AppErrorBoundary");
    if (import.meta.env.DEV) {
      console.error(info.componentStack);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isSection = this.props.variant === "section";

    return (
      <div
        className={
          isSection
            ? "flex min-h-[40vh] items-center justify-center bg-background px-4 py-10"
            : "flex min-h-screen items-center justify-center bg-background px-4"
        }
      >
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isSection ? "Não foi possível exibir esta tela" : "Algo deu errado"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente novamente ou volte para o início.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-left font-mono text-xs text-destructive break-words">
              {error.message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Ir para o início
            </a>
          </div>
        </div>
      </div>
    );
  }
}
