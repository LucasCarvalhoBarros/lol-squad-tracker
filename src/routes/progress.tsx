import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toTotalLp, winrate } from "@/lib/lol";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progresso — LoL Friends Tracker" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const { data: snapshots = [] } = useQuery({ queryKey: ["snapshots"], queryFn: api.listSnapshots });

  const rows = players.map((p) => {
    const current = toTotalLp(p.tier, p.rank, p.lp);
    const balance = current - p.startTotalLp;
    const playerSnaps = snapshots.filter((s) => s.playerId === p.id);
    const deltas = playerSnaps.map((s) => s.delta);
    const variance = deltas.length ? Math.sqrt(deltas.reduce((a, d) => a + d * d, 0) / deltas.length) : 0;
    return { player: p, balance, current, wr: winrate(p.wins, p.losses), variance };
  });

  const sorted = [...rows].sort((a, b) => b.balance - a.balance);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const consistent = [...rows].sort((a, b) => a.variance - b.variance)[0];
  const bestWr = [...rows].sort((a, b) => b.wr - a.wr)[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Progresso</h1>
        <p className="text-muted-foreground mt-1">Pontos conquistados desde o início do acompanhamento.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HighlightCard icon={<TrendingUp />} title="Maior evolução" name={top?.player.nickname} value={`+${top?.balance} LP`} tone="success" />
        <HighlightCard icon={<TrendingDown />} title="Maior queda" name={bottom?.player.nickname} value={`${bottom?.balance} LP`} tone="destructive" />
        <HighlightCard icon={<Activity />} title="Mais consistente" name={consistent?.player.nickname} value={`σ ${consistent?.variance.toFixed(1)}`} tone="primary" />
        <HighlightCard icon={<Target />} title="Melhor winrate" name={bestWr?.player.nickname} value={`${bestWr?.wr}%`} tone="primary" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">Ranking de evolução</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 pl-6">#</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-right p-3">LP Inicial</th>
                <th className="text-right p-3">LP Atual</th>
                <th className="text-right p-3">Winrate</th>
                <th className="text-right p-3 pr-6">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.player.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3 pl-6 font-bold text-primary">{i + 1}</td>
                  <td className="p-3 font-medium">{r.player.nickname}</td>
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{r.player.startTotalLp}</td>
                  <td className="p-3 text-right tabular-nums">{r.current}</td>
                  <td className={`p-3 text-right tabular-nums ${r.wr >= 50 ? "text-success" : "text-destructive"}`}>{r.wr}%</td>
                  <td className={`p-3 pr-6 text-right tabular-nums font-bold text-lg ${r.balance >= 0 ? "text-success" : "text-destructive"}`}>
                    {r.balance >= 0 ? "+" : ""}{r.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HighlightCard({ icon, title, name, value, tone }: { icon: React.ReactNode; title: string; name?: string; value: string; tone: "success" | "destructive" | "primary" }) {
  const map = { success: "text-success border-success/30", destructive: "text-destructive border-destructive/30", primary: "text-primary border-primary/30" };
  return (
    <Card className={`p-5 border-l-4 ${map[tone]}`}>
      <div className={`flex items-center gap-2 text-sm ${map[tone].split(" ")[0]}`}>{icon}<span className="font-medium">{title}</span></div>
      <div className="mt-3 text-xl font-bold truncate">{name ?? "-"}</div>
      <div className={`mt-1 text-lg font-bold ${map[tone].split(" ")[0]}`}>{value}</div>
    </Card>
  );
}
