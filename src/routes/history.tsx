import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/TierBadge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Histórico — LoL Friends Tracker" }] }),
  component: HistoryPage,
});

const COLORS = ["#f5c542", "#9b6bff", "#3ec77a", "#ff6b6b", "#76d4ff", "#ff9f43", "#a0e7e5", "#ff7eb6", "#7afcd5", "#ffd566"];

function HistoryPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const { data: snapshots = [] } = useQuery({ queryKey: ["snapshots"], queryFn: api.listSnapshots });
  const [period, setPeriod] = useState<7 | 30 | 999>(30);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");

  const cutoff = Date.now() - period * 86400000;
  const filtered = snapshots.filter((s) => new Date(s.date).getTime() >= cutoff);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    filtered.forEach((s) => {
      const day = s.date.slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, { date: day });
      const row = byDate.get(day)!;
      row[s.playerId] = s.totalLp;
    });
    return Array.from(byDate.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }, [filtered]);

  const tableRows = filtered
    .filter((s) => selectedPlayer === "all" || s.playerId === selectedPlayer)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Histórico Solo/Duo</h1>
        <p className="text-muted-foreground mt-1">Evolução de pontos ao longo do tempo.</p>
      </header>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground mr-2">Período:</span>
          {[{ v: 7 as const, l: "7 dias" }, { v: 30 as const, l: "30 dias" }, { v: 999 as const, l: "Temporada" }].map((o) => (
            <Button key={o.v} variant={period === o.v ? "default" : "outline"} size="sm" onClick={() => setPeriod(o.v)}>{o.l}</Button>
          ))}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.08)" />
              <XAxis dataKey="date" stroke="hsl(0 0% 100% / 0.5)" fontSize={11} />
              <YAxis stroke="hsl(0 0% 100% / 0.5)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.03 260)", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {players.map((p, i) => (
                <Line key={p.id} type="monotone" dataKey={p.id} name={p.nickname} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-lg">Snapshots</h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant={selectedPlayer === "all" ? "default" : "outline"} onClick={() => setSelectedPlayer("all")}>Todos</Button>
            {players.map((p) => (
              <Button key={p.id} size="sm" variant={selectedPlayer === p.id ? "default" : "outline"} onClick={() => setSelectedPlayer(p.id)}>{p.nickname}</Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 pl-6">Data</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-left p-3">Elo</th>
                <th className="text-right p-3">LP</th>
                <th className="text-right p-3">V / D</th>
                <th className="text-right p-3 pr-6">Variação</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s, idx) => {
                const player = players.find((p) => p.id === s.playerId);
                return (
                  <tr key={`${s.playerId}-${idx}`} className="border-t border-border">
                    <td className="p-3 pl-6 text-muted-foreground">{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 font-medium">{player?.nickname}</td>
                    <td className="p-3"><TierBadge tier={s.tier} rank={s.rank} lp={s.lp} /></td>
                    <td className="p-3 text-right tabular-nums">{s.totalLp}</td>
                    <td className="p-3 text-right tabular-nums"><span className="text-success">{s.wins}</span>/<span className="text-destructive">{s.losses}</span></td>
                    <td className={`p-3 pr-6 text-right tabular-nums font-bold ${s.delta >= 0 ? "text-success" : "text-destructive"}`}>{s.delta >= 0 ? "+" : ""}{s.delta}</td>
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
