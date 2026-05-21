import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toTotalLp, winrate } from "@/lib/lol";
import { TierBadge } from "@/components/TierBadge";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trophy, Crown } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LoL Friends Tracker" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const { data: snapshots = [] } = useQuery({ queryKey: ["snapshots"], queryFn: api.listSnapshots });

  const ranked = [...players].sort((a, b) => toTotalLp(b.tier, b.rank, b.lp) - toTotalLp(a.tier, a.rank, a.lp));

  // Variation last 7 days
  const cutoff = Date.now() - 7 * 86400000;
  const variations = players.map((p) => {
    const recent = snapshots.filter((s) => s.playerId === p.id && new Date(s.date).getTime() >= cutoff);
    const change = recent.length ? recent[recent.length - 1].totalLp - recent[0].totalLp : 0;
    return { player: p, change };
  });
  const topGainer = [...variations].sort((a, b) => b.change - a.change)[0];
  const topLoser = [...variations].sort((a, b) => a.change - b.change)[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da galera no ranqueado Solo/Duo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<Crown className="w-5 h-5" />} label="Top jogador" value={ranked[0]?.nickname ?? "-"} sub={ranked[0] ? `${ranked[0].tier} ${ranked[0].rank} · ${ranked[0].lp} LP` : ""} tone="primary" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Mais subiu (7d)" value={topGainer?.player.nickname ?? "-"} sub={`+${topGainer?.change ?? 0} LP`} tone="success" />
        <StatCard icon={<TrendingDown className="w-5 h-5" />} label="Mais caiu (7d)" value={topLoser?.player.nickname ?? "-"} sub={`${topLoser?.change ?? 0} LP`} tone="destructive" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Ranking por LP Total</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 pl-6">#</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-left p-3">Riot ID</th>
                <th className="text-left p-3">Elo</th>
                <th className="text-right p-3">V / D</th>
                <th className="text-right p-3">Winrate</th>
                <th className="text-right p-3 pr-6">LP Total</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((p, i) => {
                const wr = winrate(p.wins, p.losses);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3 pl-6 font-bold text-primary">{i + 1}</td>
                    <td className="p-3 font-medium">{p.nickname}</td>
                    <td className="p-3 text-muted-foreground">{p.riotId}#{p.tag}</td>
                    <td className="p-3"><TierBadge tier={p.tier} rank={p.rank} lp={p.lp} /></td>
                    <td className="p-3 text-right tabular-nums"><span className="text-success">{p.wins}</span> / <span className="text-destructive">{p.losses}</span></td>
                    <td className={`p-3 text-right tabular-nums ${wr >= 50 ? "text-success" : "text-destructive"}`}>{wr}%</td>
                    <td className="p-3 pr-6 text-right tabular-nums font-bold">{toTotalLp(p.tier, p.rank, p.lp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: "primary" | "success" | "destructive" }) {
  const colorMap = { primary: "text-primary", success: "text-success", destructive: "text-destructive" };
  return (
    <Card className="p-5">
      <div className={`flex items-center gap-2 ${colorMap[tone]} text-sm font-medium`}>{icon}{label}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className={`text-sm mt-1 ${colorMap[tone]}`}>{sub}</div>
    </Card>
  );
}
