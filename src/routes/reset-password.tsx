import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordSchema, parseOrThrow } from "@/lib/schemas";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Nova senha — OficinaPRO" }] }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const valid = parseOrThrow(ResetPasswordSchema, { password, confirm });
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: valid.password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Senha atualizada! Faça login com a nova senha.");
      navigate({ to: "/login" });
    } catch (err) {
      setLoading(false);
      toast.error((err as Error).message);
    }
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
        <h1 className="text-xl font-bold mb-1">Nova senha</h1>
        <p className="text-sm text-muted-foreground mb-5">Defina sua nova senha de acesso.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nova senha</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar senha"}
          </Button>
        </form>
        <div className="text-sm mt-4 text-center text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Ir para login
          </Link>
        </div>
      </Card>
    </div>
  );
}
