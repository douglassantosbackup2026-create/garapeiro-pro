import { z } from "zod";
import { isValidPlate, normalizePlate } from "@/lib/plate";

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export const CadastroSchema = z.object({
  nome: z.string().min(1, "Informe seu nome").max(255),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
    confirm: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As senhas não coincidem",
    path: ["confirm"],
  });

export const RecuperarSenhaSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const WorkshopSchema = z.object({
  nome: z.string().min(1, "Nome da oficina obrigatório").max(255),
  telefone: z.string().max(30).or(z.literal("")).optional(),
  endereco: z.string().max(500).or(z.literal("")).optional(),
});

export const CreateInviteSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["dono", "mecanico"]).optional(),
});

export const AcceptInviteSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/i, "Token inválido"),
});

const optionalEmail = z
  .union([z.string().email("Email inválido"), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v == null || v === "" ? null : v));

export const ClientSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(255),
  telefone: z.string().trim().min(1, "Telefone obrigatório").max(30),
  email: optionalEmail,
  data_aniversario: z.string().nullable().optional(),
});

export const ClientUpdateSchema = ClientSchema.partial();

export const VehicleSchema = z.object({
  client_id: z.string().uuid("Cliente inválido"),
  placa: z.string().transform(normalizePlate).refine(isValidPlate, "Placa inválida"),
  marca: z.string().max(100).nullable().optional(),
  modelo: z.string().max(100).nullable().optional(),
  ano: z.number().int().min(1950).max(2100).nullable().optional(),
  cor: z.string().max(50).nullable().optional(),
  km: z.number().int().min(0).nullable().optional(),
});

export const VehicleUpdateSchema = VehicleSchema.omit({ client_id: true })
  .partial()
  .extend({
    client_id: z.string().uuid().optional(),
    km_proxima_revisao: z.number().int().min(0).nullable().optional(),
    data_ultima_revisao: z.string().nullable().optional(),
    intervalo_revisao_meses: z.number().int().positive().max(60).optional(),
  });

export const OSServicoSchema = z.object({
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(500),
  valor: z.number().min(0, "Valor inválido"),
});

export const OSPecaSchema = z.object({
  nome: z.string().trim().min(1, "Nome da peça obrigatório").max(255),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valor_unitario: z.number().min(0, "Valor inválido"),
  custo_unitario: z.number().min(0).optional(),
  inventory_id: z.string().uuid().nullable().optional(),
});

const formaPagamento = z.enum(["pix", "dinheiro", "cartao", "parcelado", "a_combinar"]);

export const CreateOSSchema = z.object({
  vehicle_id: z.string().uuid(),
  client_id: z.string().uuid(),
  km_entrada: z.number().int().min(0).nullable().optional(),
  previsao_entrega: z.string().nullable().optional(),
  forma_pagamento: formaPagamento.nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  vencimento_fiado: z.string().nullable().optional(),
  categoria: z.string().max(100).nullable().optional(),
  servicos: z.array(OSServicoSchema),
  pecas: z.array(OSPecaSchema),
});

export const UpdateOSSchema = z.object({
  id: z.string().uuid(),
  previsao_entrega: z.string().nullable().optional(),
  forma_pagamento: formaPagamento.nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  vencimento_fiado: z.string().nullable().optional(),
  km_entrada: z.number().int().min(0).nullable().optional(),
  servicos: z.array(OSServicoSchema),
  pecas: z.array(OSPecaSchema),
});

export const PaymentSchema = z.object({
  service_order_id: z.string().uuid(),
  valor: z.number().positive("Valor deve ser maior que zero"),
  forma_pagamento: formaPagamento.nullable().optional(),
  observacao: z.string().max(1000).nullable().optional(),
});

export const PartSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1, "Nome obrigatório").max(255),
  codigo: z.string().max(100).nullable().optional(),
  quantidade: z.number().min(0),
  estoque_minimo: z.number().min(0),
  custo_unitario: z.number().min(0),
  preco_venda: z.number().min(0),
  unidade: z.string().max(20).optional(),
  observacao: z.string().max(1000).nullable().optional(),
});

export const AppointmentSchema = z.object({
  nome_cliente: z.string().trim().min(1, "Nome obrigatório").max(255),
  telefone: z.string().max(30).nullable().optional(),
  servico_previsto: z.string().max(500).nullable().optional(),
  categoria: z.string().max(100).nullable().optional(),
  data_hora: z.string().min(1, "Data/hora obrigatória"),
  duracao_min: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
});

export const CatalogItemSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(255),
  descricao: z.string().max(2000).nullable().optional(),
  categoria: z.string().trim().min(1).max(100),
  preco_padrao: z.number().min(0).nullable().optional(),
  duracao_estimada_min: z.number().int().positive().nullable().optional(),
  ativo: z.boolean().optional(),
});

export const WorkshopUpdateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  telefone: z.string().max(30).nullable().optional(),
  endereco: z.string().max(500).nullable().optional(),
  logo_url: z.string().nullable().optional(),
  mensagem_orcamento: z.string().max(5000).nullable().optional(),
  mensagem_atualizacao: z.string().max(5000).nullable().optional(),
  mensagem_retorno: z.string().max(5000).nullable().optional(),
  plano: z.enum(["gratuito", "solo", "oficina"]).optional(),
  playbook_unlocked_at: z.string().nullable().optional(),
});

export const SatisfactionNotaSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);

export const SmartAlertSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("retorno"),
    key: z.string(),
    clientId: z.string(),
    nome: z.string(),
    telefone: z.string(),
    diasSemVisita: z.number(),
    veiculo: z.string().nullable(),
    placa: z.string().nullable(),
  }),
  z.object({
    tipo: z.literal("revisao_km"),
    key: z.string(),
    clientId: z.string(),
    nome: z.string(),
    telefone: z.string(),
    veiculo: z.string(),
    placa: z.string(),
    kmAtual: z.number(),
    kmProxima: z.number(),
  }),
  z.object({
    tipo: z.literal("revisao_tempo"),
    key: z.string(),
    clientId: z.string(),
    nome: z.string(),
    telefone: z.string(),
    veiculo: z.string(),
    placa: z.string(),
    mesesDesde: z.number(),
  }),
  z.object({
    tipo: z.literal("aniversario"),
    key: z.string(),
    clientId: z.string(),
    nome: z.string(),
    telefone: z.string(),
    diasParaAniversario: z.number(),
  }),
  z.object({
    tipo: z.literal("satisfacao"),
    key: z.string(),
    clientId: z.string(),
    nome: z.string(),
    telefone: z.string(),
    osId: z.string(),
    osNumero: z.number(),
    diasDesdeEntrega: z.number(),
  }),
]);

export type LoginInput = z.infer<typeof LoginSchema>;
export type CadastroInput = z.infer<typeof CadastroSchema>;
export type WorkshopInput = z.infer<typeof WorkshopSchema>;
export type WorkshopUpdateInput = z.infer<typeof WorkshopUpdateSchema>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;
export type ClientInput = z.infer<typeof ClientSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;
export type VehicleInput = z.infer<typeof VehicleSchema>;
export type VehicleUpdateInput = z.infer<typeof VehicleUpdateSchema>;
export type OSServicoInput = z.infer<typeof OSServicoSchema>;
export type OSPecaInput = z.infer<typeof OSPecaSchema>;
export type CreateOSInput = z.infer<typeof CreateOSSchema>;
export type UpdateOSInput = z.infer<typeof UpdateOSSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
export type PartInput = z.infer<typeof PartSchema>;
export type AppointmentInput = z.infer<typeof AppointmentSchema>;
export type CatalogItemInput = z.infer<typeof CatalogItemSchema>;
export type SmartAlert = z.infer<typeof SmartAlertSchema>;
export type SatisfactionNota = z.infer<typeof SatisfactionNotaSchema>;

/** Parse Zod and throw the first issue message (compatible with toast.error). */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Dados inválidos");
  }
  return result.data;
}

export function errorMessage(err: unknown, fallback = "Erro inesperado"): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
