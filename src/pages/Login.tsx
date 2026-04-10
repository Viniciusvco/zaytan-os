import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import zaytanLogo from "@/assets/zaytan-logo.png";
import { toast } from "sonner";
import { Eye } from "lucide-react";

const DEMO_EMAIL = "modelo@zaytan.com";
const DEMO_PASSWORD = "modelo2026";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seu email e senha.");
    }
    setLoading(false);
  };

  const handleDemoAccess = async () => {
    setDemoLoading(true);
    try {
      // Seed demo if needed
      await supabase.functions.invoke("seed-demo");
      // Login with demo credentials
      const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
      if (error) {
        toast.error("Erro ao acessar modelo. Tente novamente.");
      }
    } catch {
      toast.error("Erro ao preparar modelo de demonstração.");
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
            <img src={zaytanLogo} alt="Zaytan" className="h-16 w-16 object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Zaytan OS</h1>
            <p className="text-sm text-muted-foreground">Faça login para acessar a plataforma</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleDemoAccess}
            disabled={demoLoading}
          >
            <Eye className="h-4 w-4" />
            {demoLoading ? "Preparando modelo..." : "Acessar Modelo Cliente"}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Acesso restrito. Entre em contato com o administrador.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}