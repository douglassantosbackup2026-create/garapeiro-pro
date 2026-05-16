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
  head: () => ({ meta: [{ title: "Entrar — MecânicoPRO" }] }),
});

async function fetchWorkshopId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .maybeSingle();
  return data?.workshop_id ?? null;
}

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(
        error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message,
      );
      return;
    }
    const userId = data.user?.id;
    const workshopId = userId ? await fetchWorkshopId(userId) : null;
    setLoading(false);
    toast.success("Bem-vindo de volta!");
    if (redirect) {
      navigate({ to: redirect });
      return;
    }
    if (!workshopId) {
      navigate({ to: "/onboarding" });
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-primary rounded-md p-1.5">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display font-bold text-lg">MecânicoPRO</div>
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
