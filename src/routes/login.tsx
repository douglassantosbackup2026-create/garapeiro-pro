import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoginSchema } from "@/lib/schemas";

type LoginSearch = { redirect?: string };

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Entrar — OficinaPRO" }] }),
});

async function fetchWorkshopId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.workshop_id ?? null;
}

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos",
    "Email not confirmed": "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
    "User not found": "Usuário não encontrado",
    "Too many requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  };
  return map[message] ?? message;
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    setLoading(true);
    setNeedsConfirmation(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message === "Email not confirmed") setNeedsConfirmation(true);
      toast.error(translateAuthError(error.message));
      return;
    }
    const userId = data.user?.id;
    const workshopId = userId ? await fetchWorkshopId(userId) : null;
    setLoading(false);
    toast.success("Bem-vindo de volta!");
    const safeRedirect =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : null;
    if (!workshopId) {
      navigate({ to: "/onboarding" });
      return;
    }
    if (safeRedirect && safeRedirect !== "/onboarding") {
      navigate({ to: safeRedirect });
      return;
    }
    navigate({ to: "/" });
  }

  async function handleResendConfirmation() {
    if (!email) {
      toast.error("Informe seu e-mail para reenviar a confirmação.");
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setResending(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    toast.success("E-mail de confirmação reenviado.");
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
        <h1 className="text-xl font-bold mb-1">Entrar</h1>
        <p className="text-sm text-muted-foreground mb-5">Acesse sua oficina</p>
        <form onSubmit={handleSubmit} className="space-y-3">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        {needsConfirmation && (
          <Button
            type="button"
            variant="outline"
            className="w-full mt-3"
            onClick={handleResendConfirmation}
            disabled={resending}
          >
            {resending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </Button>
        )}
        <div className="flex justify-between mt-4 text-sm">
          <Link to="/recuperar-senha" className="text-primary hover:underline">
            Esqueci a senha
          </Link>
          <Link to="/cadastro" className="text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </Card>
    </div>
  );
}
