import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { PlateInput } from "@/components/PlateInput";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateVehicle, useVehicleByPlate } from "@/hooks/useVehicles";
import { useCreateServiceOrder } from "@/hooks/useServiceOrders";
import { useWorkshop } from "@/hooks/useWorkshop";
import { isValidPlate, lookupPlateMock, normalizePlate } from "@/lib/plate";
import { formatBRL, formatOSNumber } from "@/lib/format";
import { buildWhatsappUrl, renderOrcamento } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/os/nova")({ component: NovaOS });

const SUGESTOES = [
  "Troca de óleo",
  "Alinhamento",
  "Balanceamento",
  "Troca de freio",
  "Revisão geral",
  "Suspensão",
  "Diagnóstico elétrico",
  "Funilaria",
  "Pintura",
  "Troca de correia",
];

const PAGAMENTOS: { value: Database["public"]["Enums"]["forma_pagamento"]; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "parcelado", label: "Parcelado" },
  { value: "a_combinar", label: "A combinar" },
];

function NovaOS() {
  const navigate = useNavigate();
  const { data: workshop } = useWorkshop();
  const { data: clients } = useClients();
  const lookupPlate = useVehicleByPlate();
  const createClient = useCreateClient();
  const createVehicle = useCreateVehicle();
  const createOS = useCreateServiceOrder();

  const [step, setStep] = useState(1);

  // P1
  const [placa, setPlaca] = useState("");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [cor, setCor] = useState("");
  const [km, setKm] = useState("");
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", email: "" });
  const [searchCliente, setSearchCliente] = useState("");
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [searching, setSearching] = useState(false);

  // P2
  const [servicos, setServicos] = useState<{ descricao: string; valor: number }[]>([]);
  const [pecas, setPecas] = useState<
    { nome: string; quantidade: number; valor_unitario: number }[]
  >([]);

  // P3
  const [previsao, setPrevisao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pagamento, setPagamento] =
    useState<Database["public"]["Enums"]["forma_pagamento"] | null>(null);
  const [enviarWhats, setEnviarWhats] = useState(true);

  const totalServ = servicos.reduce((s, x) => s + Number(x.valor || 0), 0);
  const totalPecas = pecas.reduce(
    (s, x) => s + Number(x.quantidade || 0) * Number(x.valor_unitario || 0),
    0
  );
  const total = totalServ + totalPecas;

  const filteredClients = useMemo(() => {
    if (!searchCliente) return [];
    const s = searchCliente.toLowerCase();
    return (clients ?? [])
      .filter((c) => c.nome.toLowerCase().includes(s) || c.telefone.includes(s))
      .slice(0, 5);
  }, [searchCliente, clients]);

  async function buscarPlaca() {
    if (!isValidPlate(placa)) {
      toast.error("Placa inválida. Use AAA-0000 ou AAA-0A00");
      return;
    }
    setSearching(true);
    try {
      const existing = await lookupPlate.mutateAsync(normalizePlate(placa));
      if (existing) {
        setVehicleId(existing.id);
        setClientId(existing.client_id);
        setMarca(existing.marca ?? "");
        setModelo(existing.modelo ?? "");
        setAno(existing.ano ? String(existing.ano) : "");
        setCor(existing.cor ?? "");
        setKm(existing.km ? String(existing.km) : "");
        toast.success(`Veículo encontrado: ${existing.clients?.nome}`);
      } else {
        const mock = await lookupPlateMock(placa);
        if (mock) {
          setMarca(mock.marca);
          setModelo(mock.modelo);
          setAno(String(mock.ano));
          toast.info("Veículo novo — preencha os dados do cliente");
        } else {
          toast.info("Veículo não encontrado — preencha manualmente");
        }
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleCreate() {
    try {
      let finalClientId = clientId;
      let finalVehicleId = vehicleId;

      if (!finalClientId) {
        if (!novoCliente.nome || !novoCliente.telefone) {
          toast.error("Preencha nome e telefone do cliente");
          setStep(1);
          return;
        }
        const c = await createClient.mutateAsync({
          nome: novoCliente.nome,
          telefone: novoCliente.telefone.replace(/\D/g, ""),
          email: novoCliente.email || null,
        });
        finalClientId = c.id;
      }
      if (!finalVehicleId) {
        const v = await createVehicle.mutateAsync({
          client_id: finalClientId,
          placa: normalizePlate(placa),
          marca: marca || null,
          modelo: modelo || null,
          ano: ano ? Number(ano) : null,
          cor: cor || null,
          km: km ? Number(km) : null,
        });
        finalVehicleId = v.id;
      }

      const os = await createOS.mutateAsync({
        vehicle_id: finalVehicleId,
        client_id: finalClientId,
        km_entrada: km ? Number(km) : null,
        previsao_entrega: previsao || null,
        forma_pagamento: pagamento,
        observacoes: observacoes || null,
        servicos,
        pecas,
      });

      toast.success(`OS ${formatOSNumber(os.numero)} criada!`);

      if (enviarWhats) {
        const cliente = clients?.find((c) => c.id === finalClientId);
        const phone = cliente?.telefone ?? novoCliente.telefone.replace(/\D/g, "");
        if (workshop && phone) {
          const url = buildWhatsappUrl(
            phone,
            renderOrcamento(
              {
                numero: os.numero,
                cliente_nome: cliente?.nome ?? novoCliente.nome,
                veiculo: `${marca} ${modelo}`.trim(),
                placa: normalizePlate(placa),
                servicos,
                pecas: pecas.map((p) => ({
                  nome: p.nome,
                  quantidade: p.quantidade,
                  valor_total: p.quantidade * p.valor_unitario,
                })),
                total,
                previsao_entrega: previsao || null,
              },
              workshop
            )
          );
          window.open(url, "_blank");
        }
      }

      navigate({ to: "/os/$osId", params: { osId: os.id } });
    } catch (e) {
      toast.error("Erro ao criar OS: " + (e as Error).message);
    }
  }

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto">
      <button
        onClick={() => (step === 1 ? navigate({ to: "/os" }) : setStep(step - 1))}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="text-2xl font-bold mb-2">Nova Ordem de Serviço</h1>
      <Progress value={(step / 3) * 100} className="mb-1 h-2" />
      <p className="text-xs text-muted-foreground mb-5">Passo {step} de 3</p>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Placa do veículo</Label>
            <div className="flex gap-2 mt-1">
              <PlateInput value={placa} onChange={setPlaca} />
              <Button onClick={buscarPlaca} disabled={searching} variant="outline">
                {searching ? "..." : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Input value={marca} onChange={(e) => setMarca(e.target.value)} />
            </div>
            <div>
              <Label>Modelo</Label>
              <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </div>
            <div>
              <Label>Ano</Label>
              <Input value={ano} onChange={(e) => setAno(e.target.value)} type="number" />
            </div>
            <div>
              <Label>Cor</Label>
              <Input value={cor} onChange={(e) => setCor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Quilometragem</Label>
            <Input value={km} onChange={(e) => setKm(e.target.value)} type="number" />
          </div>

          <div className="border-t pt-4">
            <Label>Cliente</Label>
            {clientId ? (
              <Card className="p-3 mt-2 flex justify-between items-center">
                <span className="font-medium">
                  {clients?.find((c) => c.id === clientId)?.nome}
                </span>
                <Button size="sm" variant="ghost" onClick={() => setClientId(null)}>
                  Trocar
                </Button>
              </Card>
            ) : showNovoCliente ? (
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Nome"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                />
                <Input
                  placeholder="Telefone (WhatsApp)"
                  value={novoCliente.telefone}
                  onChange={(e) =>
                    setNovoCliente({ ...novoCliente, telefone: e.target.value })
                  }
                />
                <Input
                  placeholder="E-mail (opcional)"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNovoCliente(false)}
                >
                  ← Buscar existente
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                />
                {filteredClients.length > 0 && (
                  <div className="mt-1 border rounded-md divide-y">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientId(c.id);
                          setSearchCliente("");
                        }}
                        className="w-full text-left p-2 hover:bg-muted text-sm"
                      >
                        {c.nome} · {c.telefone}
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => setShowNovoCliente(true)}
                  className="px-0"
                >
                  + Cadastrar novo cliente
                </Button>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!isValidPlate(placa)) {
                toast.error("Placa inválida");
                return;
              }
              if (!clientId && !showNovoCliente) {
                toast.error("Selecione ou cadastre um cliente");
                return;
              }
              if (!clientId && (!novoCliente.nome || !novoCliente.telefone)) {
                toast.error("Preencha nome e telefone");
                return;
              }
              setStep(2);
            }}
          >
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <Label>Serviços</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => setServicos([...servicos, { descricao: s, valor: 0 }])}
                  className="text-xs px-2.5 py-1 rounded-full border bg-background hover:bg-muted"
                >
                  + {s}
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-3">
              {servicos.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={s.descricao}
                    onChange={(e) => {
                      const c = [...servicos];
                      c[i].descricao = e.target.value;
                      setServicos(c);
                    }}
                    placeholder="Descrição"
                  />
                  <Input
                    type="number"
                    value={s.valor || ""}
                    onChange={(e) => {
                      const c = [...servicos];
                      c[i].valor = Number(e.target.value);
                      setServicos(c);
                    }}
                    placeholder="R$"
                    className="w-24"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setServicos(servicos.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setServicos([...servicos, { descricao: "", valor: 0 }])}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Serviço
              </Button>
            </div>
          </div>

          <div>
            <Label>Peças</Label>
            <div className="space-y-2 mt-2">
              {pecas.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-5"
                    value={p.nome}
                    onChange={(e) => {
                      const c = [...pecas];
                      c[i].nome = e.target.value;
                      setPecas(c);
                    }}
                    placeholder="Nome da peça"
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    value={p.quantidade || ""}
                    onChange={(e) => {
                      const c = [...pecas];
                      c[i].quantidade = Number(e.target.value);
                      setPecas(c);
                    }}
                    placeholder="Qtd"
                  />
                  <Input
                    className="col-span-4"
                    type="number"
                    value={p.valor_unitario || ""}
                    onChange={(e) => {
                      const c = [...pecas];
                      c[i].valor_unitario = Number(e.target.value);
                      setPecas(c);
                    }}
                    placeholder="Valor unit."
                  />
                  <Button
                    className="col-span-1"
                    size="icon"
                    variant="ghost"
                    onClick={() => setPecas(pecas.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setPecas([...pecas, { nome: "", quantidade: 1, valor_unitario: 0 }])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Peça
              </Button>
            </div>
          </div>

          <Card className="p-4 bg-muted/50">
            <div className="flex justify-between text-sm">
              <span>Mão de obra</span>
              <span className="font-medium">{formatBRL(totalServ)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Peças</span>
              <span className="font-medium">{formatBRL(totalPecas)}</span>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t">
              <span className="font-bold">Total</span>
              <span className="font-display font-bold text-2xl text-money">
                {formatBRL(total)}
              </span>
            </div>
          </Card>

          <Button className="w-full" size="lg" onClick={() => setStep(3)}>
            Próximo <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>Previsão de entrega</Label>
            <Input
              type="date"
              value={previsao}
              onChange={(e) => setPrevisao(e.target.value)}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Cliente pediu para ligar antes de retirar"
            />
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PAGAMENTOS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPagamento(p.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm",
                    pagamento === p.value
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-background"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Card className="p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Enviar orçamento por WhatsApp</div>
              <div className="text-xs text-muted-foreground">
                Abre o WhatsApp ao salvar
              </div>
            </div>
            <Switch checked={enviarWhats} onCheckedChange={setEnviarWhats} />
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleCreate}
            disabled={createOS.isPending}
          >
            {createOS.isPending ? "Criando..." : "Criar Ordem de Serviço"}
          </Button>
        </div>
      )}
    </div>
  );
}