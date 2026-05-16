import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export const CadastroSchema = z.object({
  nome: z.string().min(1, "Informe seu nome").max(255),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

export const WorkshopSchema = z.object({
  nome: z.string().min(1, "Nome da oficina obrigatório").max(255),
  telefone: z.string().max(30).or(z.literal("")).optional(),
  endereco: z.string().max(500).or(z.literal("")).optional(),
});
