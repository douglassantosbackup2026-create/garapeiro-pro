import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkshop } from "@/hooks/useWorkshop";
import { playbookAssets } from "@/lib/playbookAssets";

export const Route = createFileRoute("/playbook")({
  component: PlaybookPage,
  head: () => ({ meta: [{ title: "Playbook — OficinaPRO" }] }),
});

function PlaybookPage() {
  const { data: workshop, isLoading } = useWorkshop();
  const unlocked = Boolean(workshop?.playbook_unlocked_at);

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card className="space-y-4 p-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Lock className="size-6 text-muted-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold">Playbook bloqueado</h1>
          <p className="text-sm text-muted-foreground">
            Os materiais do Playbook liberam após a compra no diagnóstico. Faça
            o quiz ou, se já comprou, libere em Ajustes.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/quiz">Ir ao diagnóstico</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/configuracoes">Abrir Ajustes</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookMarked className="size-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Playbook OficinaPRO
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Materiais liberados para sua oficina. Baixe e aplique no dia a dia.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {playbookAssets.map((asset) => (
          <li key={asset.id}>
            <a
              href={asset.pdfPath}
              download={asset.pdfFileName}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <div>
                <p className="text-sm font-semibold">{asset.title}</p>
                <p className="text-xs text-muted-foreground">{asset.subtitle}</p>
              </div>
              <Download className="size-4 shrink-0 text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
