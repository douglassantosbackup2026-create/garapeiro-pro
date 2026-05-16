import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recuperar-senha")({
  component: RecuperarSenhaPage,
  head: () => ({ meta: [{ title: "Recuperar senha — MecânicoPRO" }] }),
});

function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Enviamos um link para redefinir sua senha.");
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
        <h1 className="text-xl font-bold mb-1">Recuperar senha</h1>
        {sent ? (
          <p className="text-sm text-muted-foreground mb-5">
            Se existir uma conta com esse e-mail, você receberá instruções em breve.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-5">
              Informe seu e-mail para receber o link de redefinição.
            </p>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          </>
        )}
        <div className="text-sm mt-4 text-center text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      </Card>
    </div>
  );
}
