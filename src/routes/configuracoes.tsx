import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useWorkshop, useUpdateWorkshop } from "@/hooks/useWorkshop";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({ component: Configuracoes });

function Configuracoes() {
  const { data: workshop } = useWorkshop();
  const update = useUpdateWorkshop();
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

  const save = async (patch: Record<string, unknown>) => {
    await update.mutateAsync(patch);
    toast.success("Salvo!");
  };

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Configurações</h1>

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
          onClick={() =>
            save({
              nome: form.nome,
              telefone: form.telefone,
              endereco: form.endereco,
            })
          }
        >
          Salvar
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Mensagens do WhatsApp</h2>
        <p className="text-xs text-muted-foreground">
          Variáveis: {"{cliente}"} {"{veiculo}"} {"{placa}"} {"{numero}"} {"{itens}"}{" "}
          {"{total}"} {"{previsao}"} {"{status}"} {"{oficina}"}
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

      <Card className="p-4 space-y-2">
        <h2 className="font-bold">Assinatura</h2>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold capitalize">
            Plano: {workshop?.plano ?? "gratuito"}
          </span>
          <Button variant="outline" size="sm">
            Fazer upgrade
          </Button>
        </div>
      </Card>
    </div>
  );
}