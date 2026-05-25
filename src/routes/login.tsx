import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Gamepad2, LogIn, UserRound, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — LoL Friends Tracker" }] }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  if (auth.isAuthed) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (auth.login(user, pass)) {
      navigate({ to: "/dashboard" });
    } else {
      setError("Credenciais inválidas");
    }
  };

  const guest = () => {
    auth.loginAsGuest();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl gamer-glow flex items-center justify-center bg-gradient-to-br from-primary to-accent mb-3">
            <Gamepad2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl">LoL Friends Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe a galera no rift</p>
        </div>

        <Card className="p-6 space-y-5">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Login</Label>
              <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="admin" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <Button type="submit" className="w-full">
              <LogIn className="w-4 h-4 mr-2" /> Entrar
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>

          <Button variant="outline" className="w-full" onClick={guest}>
            <UserRound className="w-4 h-4 mr-2" /> Acessar como visitante
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Visitantes podem visualizar e montar times 5x5, mas não cadastram nem sincronizam jogadores.
          </p>
        </Card>
      </div>
    </div>
  );
}
