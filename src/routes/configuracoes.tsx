import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { WorkshopSchema } from "@/lib/schemas";

type WorkshopUpdate = Database["public"]["Tables"]["workshops"]["Update"];
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useWorkshop, useUpdateWorkshop, useUploadLogo, useRemoveLogo } from "@/hooks/useWorkshop";
import { toast } from "sonner";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { TeamSection } from "@/components/TeamSection";
import { PlanBillingSection } from "@/components/PlanBillingSection";
import {
  clearPlaybookTrialIntent,
  peekPlaybookOrderId,
} from "@/lib/playbookAssets";
import { unlockPlaybook } from "@/lib/workshop.functions";

export const Route = createFileRoute("/configuracoes")({
  component: Configuracoes,
  validateSearch: (search: Record<string, unknown>): { upgrade?: string } => ({
    upgrade: typeof search.upgrade === "string" ? search.upgrade : undefined,
  }),
});

function Configuracoes() {
  const { upgrade } = Route.useSearch();
  const { data: workshop, refetch } = useWorkshop();
  const update = useUpdateWorkshop();
  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    mensagem_orcamento: "",
    mensagem_atualizacao: "",
    mensagem_retorno: "",
  });

  useEffect(() => {
    if (workshop)
      setForm({
        nome: workshop.nome ?? "",
        telefone: workshop.telefone ?? "",
        endereco: workshop.endereco ?? "",
        mensagem_orcamento: workshop.mensagem_orcamento ?? "",
        mensagem_atualizacao: workshop.mensagem_atualizacao ?? "",
        mensagem_retorno: workshop.mensagem_retorno ?? "",
      });
  }, [workshop]);

  useEffect(() => {
    if (upgrade === "1") {
      requestAnimationFrame(() => {
        document.getElementById("planos-upgrade")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [upgrade]);

  const save = async (patch: WorkshopUpdate) => {
    try {
      await update.mutateAsync(patch);
      toast.success("Salvo!");
    } catch {
      // MutationCache já notifica
    }
  };

  const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Use PNG, JPG ou WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Máximo 2 MB");
      return;
    }
    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Logo atualizado!");
    } catch {
      // MutationCache já notifica
    }
  };

  const onRemoveLogo = async () => {
    try {
      await removeLogo.mutateAsync(workshop?.logo_url);
      toast.success("Logo removido");
    } catch {
      // MutationCache já notifica
    }
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <PlanBillingSection highlightUpgrade={upgrade === "1"} />

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Logo da oficina</h2>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
            {workshop?.logo_url ? (
              <img
                src={workshop.logo_url}
                alt="Logo da oficina"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onPickLogo}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadLogo.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploadLogo.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {workshop?.logo_url ? "Trocar logo" : "Enviar logo"}
            </Button>
            {workshop?.logo_url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={removeLogo.isPending}
                onClick={onRemoveLogo}
              >
                Remover
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP. Até 2 MB.</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Minha Oficina</h2>
        <div>
          <Label>Nome</Label>
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div>
          <Label>Telefone / WhatsApp</Label>
          <Input
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <div>
          <Label>Endereço</Label>
          <Input
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          />
        </div>
        <Button
          onClick={() => {
            const result = WorkshopSchema.safeParse({
              nome: form.nome,
              telefone: form.telefone,
              endereco: form.endereco,
            });
            if (!result.success) {
              toast.error(result.error.issues[0].message);
              return;
            }
            save({
              nome: result.data.nome,
              telefone: result.data.telefone,
              endereco: result.data.endereco,
            });
          }}
        >
          Salvar
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Mensagens do WhatsApp</h2>
        <p className="text-xs text-muted-foreground">
          Variáveis: {"{cliente}"} {"{veiculo}"} {"{placa}"} {"{numero}"} {"{itens}"} {"{total}"}{" "}
          {"{previsao}"} {"{status}"} {"{oficina}"}
        </p>
        <div>
          <Label>Orçamento</Label>
          <Textarea
            rows={6}
            value={form.mensagem_orcamento}
            onChange={(e) => setForm({ ...form, mensagem_orcamento: e.target.value })}
          />
        </div>
        <div>
          <Label>Atualização de status</Label>
          <Textarea
            rows={4}
            value={form.mensagem_atualizacao}
            onChange={(e) => setForm({ ...form, mensagem_atualizacao: e.target.value })}
          />
        </div>
        <div>
          <Label>Lembrete de retorno</Label>
          <Textarea
            rows={4}
            value={form.mensagem_retorno}
            onChange={(e) => setForm({ ...form, mensagem_retorno: e.target.value })}
          />
        </div>
        <Button
          onClick={() =>
            save({
              mensagem_orcamento: form.mensagem_orcamento,
              mensagem_atualizacao: form.mensagem_atualizacao,
              mensagem_retorno: form.mensagem_retorno,
            })
          }
        >
          Salvar mensagens
        </Button>
      </Card>

      <TeamSection />

      <Card className="space-y-3 p-4">
        <h2 className="font-bold">Playbook OficinaPRO</h2>
        {workshop?.playbook_unlocked_at ? (
          <p className="text-sm text-muted-foreground">
            Materiais liberados. Acesse pelo menu <strong>Playbook</strong>.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Já comprou o Playbook no diagnóstico? Liberamos automaticamente após
              o pagamento aprovado (pedido salvo no navegador após o checkout).
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const orderId = peekPlaybookOrderId();
                if (!orderId) {
                  toast.error(
                    "Nenhum pedido encontrado neste navegador. Conclua a compra no diagnóstico ou use o mesmo dispositivo.",
                  );
                  return;
                }
                try {
                  await unlockPlaybook({ data: { orderId } });
                  clearPlaybookTrialIntent();
                  toast.success("Playbook liberado no menu!");
                  await refetch();
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              Liberar com pedido aprovado
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
