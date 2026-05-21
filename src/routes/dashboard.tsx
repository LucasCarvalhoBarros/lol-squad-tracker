import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { rankTotalLp, winrate } from "@/lib/lol";
import { TierBadge } from "@/components/TierBadge";
import { Card } from "@/components/ui/card";
import { Trophy, Crown, AlertCircle, Loader2 } from "lucide-react";
import type { Player, RankEntry } from "@/lib/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — LoL Friends Tracker" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const playersQ = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const players = playersQ.data ?? [];

  const rankQueries = useQueries({
    queries: players.map((p) => ({
      queryKey: ["current-rank", p.id],
      queryFn: () => api.getCurrentRank(p.id),
      enabled: !!p.id,
    })),
  });

  const ranks = new Map<string, RankEntry | null>();
  players.forEach((p, i) => ranks.set(p.id, (rankQueries[i]?.data as RankEntry | null | undefined) ?? null));

  const ranked = [...players].sort(
    (a, b) => rankTotalLp(ranks.get(b.id)) - rankTotalLp(ranks.get(a.id)),
  );

  if (playersQ.isLoading) return <PageState icon={<Loader2 className="w-6 h-6 animate-spin" />} title="Carregando jogadores..." />;
  if (playersQ.error)
    return <PageState icon={<AlertCircle className="w-6 h-6 text-destructive" />} title="Erro ao carregar" desc={(playersQ.error as ApiError).message} />;
  if (players.length === 0)
    return <PageState icon={<Crown className="w-6 h-6 text-muted-foreground" />} title="Nenhum jogador cadastrado" desc="Vá em Jogadores para adicionar o primeiro." />;

  const topPlayer = ranked[0];
  const topRank = topPlayer ? ranks.get(topPlayer.id) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da galera no ranqueado Solo/Duo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Top jogador" value={topPlayer?.nickname ?? "-"} sub={topRank ? `${topRank.tier} ${topRank.rank} · ${topRank.leaguePoints} LP` : "Sem dados"} />
        <StatCard label="Total de jogadores" value={String(players.length)} sub={`${players.filter((p) => p.active).length} ativos`} />
        <StatCard label="Sincronizados" value={`${rankQueries.filter((q) => q.data).length}/${players.length}`} sub="com rank disponível" />
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
                const r = ranks.get(p.id);
                const wr = r ? winrate(r.wins, r.losses) : 0;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-3 pl-6 font-bold text-primary">{i + 1}</td>
                    <td className="p-3 font-medium">{p.nickname}</td>
                    <td className="p-3 text-muted-foreground">{p.riotGameName}#{p.riotTagLine}</td>
                    <td className="p-3">
                      {r ? (
                        <TierBadge tier={r.tier} rank={r.rank} lp={r.leaguePoints} />
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Ainda não sincronizado</span>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {r ? <><span className="text-success">{r.wins}</span> / <span className="text-destructive">{r.losses}</span></> : "-"}
                    </td>
                    <td className={`p-3 text-right tabular-nums ${wr >= 50 ? "text-success" : "text-destructive"}`}>{r ? `${wr}%` : "-"}</td>
                    <td className="p-3 pr-6 text-right tabular-nums font-bold">{r ? rankTotalLp(r) : "-"}</td>
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

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-5">
      <div className="text-sm font-medium text-primary">{label}</div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

function PageState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      {icon}
      <h2 className="text-xl font-bold">{title}</h2>
      {desc && <p className="text-muted-foreground">{desc}</p>}
    </div>
  );
}

// satisfy lint: Player type imported but unused removed
export type _P = Player;
