import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { rankTotalLp, winrate } from "@/lib/lol";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, Loader2, AlertCircle } from "lucide-react";
import type { RankEntry } from "@/lib/types";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progresso — LoL Friends Tracker" }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const playersQ = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const players = playersQ.data ?? [];

  const historyQueries = useQueries({
    queries: players.map((p) => ({
      queryKey: ["rank-history", p.id],
      queryFn: () => api.getRankHistory(p.id),
    })),
  });

  if (playersQ.isLoading) {
    return <div className="py-24 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Carregando...</div>;
  }
  if (playersQ.error) {
    return <div className="py-24 text-center text-destructive"><AlertCircle className="w-5 h-5 inline mr-2" />{(playersQ.error as ApiError).message}</div>;
  }
  if (players.length === 0) {
    return <div className="py-24 text-center text-muted-foreground">Nenhum jogador cadastrado.</div>;
  }

  const rows = players.map((p, i) => {
    const history = (historyQueries[i]?.data as RankEntry[] | undefined) ?? [];
    const sorted = [...history].sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const start = first ? rankTotalLp(first) : 0;
    const current = last ? rankTotalLp(last) : 0;
    const balance = current - start;
    const deltas: number[] = [];
    for (let k = 1; k < sorted.length; k++) deltas.push(rankTotalLp(sorted[k]) - rankTotalLp(sorted[k - 1]));
    const variance = deltas.length ? Math.sqrt(deltas.reduce((a, d) => a + d * d, 0) / deltas.length) : 0;
    const wr = last ? winrate(last.wins, last.losses) : 0;
    return { player: p, start, current, balance, variance, wr, hasData: !!last };
  });

  const withData = rows.filter((r) => r.hasData);
  const sorted = [...rows].sort((a, b) => b.balance - a.balance);
  const top = withData.length ? [...withData].sort((a, b) => b.balance - a.balance)[0] : null;
  const bottom = withData.length ? [...withData].sort((a, b) => a.balance - b.balance)[0] : null;
  const consistent = withData.length ? [...withData].sort((a, b) => a.variance - b.variance)[0] : null;
  const bestWr = withData.length ? [...withData].sort((a, b) => b.wr - a.wr)[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Progresso</h1>
        <p className="text-muted-foreground mt-1">Pontos conquistados desde o início do acompanhamento.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HighlightCard icon={<TrendingUp />} title="Maior evolução" name={top?.player.nickname} value={top ? `${top.balance >= 0 ? "+" : ""}${top.balance} LP` : "-"} tone="success" />
        <HighlightCard icon={<TrendingDown />} title="Maior queda" name={bottom?.player.nickname} value={bottom ? `${bottom.balance} LP` : "-"} tone="destructive" />
        <HighlightCard icon={<Activity />} title="Mais consistente" name={consistent?.player.nickname} value={consistent ? `σ ${consistent.variance.toFixed(1)}` : "-"} tone="primary" />
        <HighlightCard icon={<Target />} title="Melhor winrate" name={bestWr?.player.nickname} value={bestWr ? `${bestWr.wr}%` : "-"} tone="primary" />
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
                  <td className="p-3 text-right tabular-nums text-muted-foreground">{r.hasData ? r.start : "-"}</td>
                  <td className="p-3 text-right tabular-nums">{r.hasData ? r.current : "-"}</td>
                  <td className={`p-3 text-right tabular-nums ${r.wr >= 50 ? "text-success" : "text-destructive"}`}>{r.hasData ? `${r.wr}%` : "-"}</td>
                  <td className={`p-3 pr-6 text-right tabular-nums font-bold text-lg ${
                    r.player.nickname === "Titi"
                      ? (r.balance >= 0 ? "text-destructive" : "text-success")
                      : (r.balance >= 0 ? "text-success" : "text-destructive")
                  }`}>
                    {r.hasData ? `${r.balance >= 0 ? "+" : ""}${r.balance}` : "-"}
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
