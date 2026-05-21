import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — LoL Friends Tracker" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Conecte sua API AWS e ajuste o tracker.</p>
      </header>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg">API Backend</h2>
        <div className="space-y-1.5">
          <Label>URL base da API</Label>
          <Input placeholder="https://api.lolfriends.aws.com" defaultValue={import.meta.env.VITE_API_BASE_URL ?? ""} />
          <p className="text-xs text-muted-foreground">Configure também em <code className="text-primary">VITE_API_BASE_URL</code>.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Riot API Key</Label>
          <Input type="password" placeholder="RGAPI-xxxxxxxx" />
        </div>
        <Button>Salvar</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg">Preferências</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Sincronização automática</div>
            <p className="text-xs text-muted-foreground">Buscar dados da Riot a cada 30 minutos.</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Notificar quedas grandes</div>
            <p className="text-xs text-muted-foreground">Alerta quando alguém perde mais de 50 LP.</p>
          </div>
          <Switch />
        </div>
      </Card>
    </div>
  );
}
