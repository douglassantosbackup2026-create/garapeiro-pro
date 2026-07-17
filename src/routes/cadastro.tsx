import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CadastroSchema } from "@/lib/schemas";
import { rememberPlaybookTrialFromSearch } from "@/lib/playbookAssets";

type CadastroSearch = {
  redirect?: string;
  trial?: string;
  order?: string;
  plano?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

function asOptionalString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function translateSignupError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("already registered") || msg.includes("user already"))
    return "Este e-mail já tem uma conta. Faça login.";
  if (msg.includes("password") && msg.includes("6"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("weak password")) return "Senha muito fraca. Use pelo menos 8 caracteres.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Muitas tentativas. Aguarde alguns minutos.";
  if (msg.includes("invalid email")) return "E-mail inválido.";
  return message;
}

export const Route = createFileRoute("/cadastro")({
  component: SignupPage,
  validateSearch: (search: Record<string, unknown>): CadastroSearch => ({
    redirect: asOptionalString(search.redirect),
    trial: asOptionalString(search.trial),
    order: asOptionalString(search.order),
    plano: asOptionalString(search.plano),
    utm_source: asOptionalString(search.utm_source),
    utm_medium: asOptionalString(search.utm_medium),
    utm_campaign: asOptionalString(search.utm_campaign),
    utm_content: asOptionalString(search.utm_content),
    utm_term: asOptionalString(search.utm_term),
  }),
  head: () => ({ meta: [{ title: "Criar conta — OficinaPRO" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { adoptSession } = useAuth();
  const search = Route.useSearch();
  const { redirect, trial, order, plano } = search;
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    rememberPlaybookTrialFromSearch({ trial, order });
    if (plano === "solo" || plano === "oficina") {
      try {
        localStorage.setItem("oficinapro-desired-plano", plano);
      } catch {
        /* ignore */
      }
    }
  }, [trial, order, plano]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = CadastroSchema.safeParse({ nome, email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    setLoading(true);
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/onboarding`,
        data: { nome },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(translateSignupError(error.message));
      return;
    }
    if (!data.session) {
      setAwaitingEmail(true);
      toast.success("Verifique seu e-mail para confirmar a conta.");
      return;
    }
    await adoptSession(data.session);
    toast.success("Conta criada! Vamos configurar sua oficina.");
    const safeRedirect =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
    navigate({ to: safeRedirect === "/onboarding" || !safeRedirect ? "/onboarding" : safeRedirect });
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setResending(false);
    if (error) {
      toast.error(translateSignupError(error.message));
      return;
    }
    toast.success("E-mail de confirmação reenviado.");
  }

  if (awaitingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <h1 className="text-xl font-bold mb-2">Confirme seu e-mail</h1>
          <p className="text-sm text-muted-foreground mb-5">
            Enviamos um link de confirmação para <strong>{email}</strong>. Após confirmar, faça
            login para continuar.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-2"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "Reenviando..." : "Reenviar e-mail"}
          </Button>
          <Button asChild className="w-full">
            <Link to="/login" search={{ redirect: "/onboarding" }}>
              Ir para login
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-lg">OficinaPRO</div>
        </div>
        <h1 className="text-xl font-bold mb-1">Criar conta</h1>
        <p className="text-sm text-muted-foreground mb-5">Comece grátis em 1 minuto</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Seu nome</Label>
            <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <div className="text-sm mt-4 text-center text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </Card>
    </div>
  );
}
