import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { rankTotalLp } from "@/lib/lol";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/TierBadge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, AlertCircle, LineChart as LineChartIcon } from "lucide-react";
import type { RankEntry } from "@/lib/types";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Histórico — LoL Friends Tracker" }] }),
  component: HistoryPage,
});

const COLORS = ["#f5c542", "#9b6bff", "#3ec77a", "#ff6b6b", "#76d4ff", "#ff9f43", "#a0e7e5", "#ff7eb6", "#7afcd5", "#ffd566"];

function HistoryPage() {
  const playersQ = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const players = playersQ.data ?? [];

  const historyQueries = useQueries({
    queries: players.map((p) => ({
      queryKey: ["rank-history", p.id],
      queryFn: () => api.getRankHistory(p.id),
    })),
  });

  const [period, setPeriod] = useState<7 | 30 | 999>(30);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [intradayDate, setIntradayDate] = useState<string>("");
  const [intradayPlayer, setIntradayPlayer] = useState<string>("all");

  const allHistory: (RankEntry & { nickname: string })[] = useMemo(() => {
    const out: (RankEntry & { nickname: string })[] = [];
    players.forEach((p, i) => {
      const list = (historyQueries[i]?.data as RankEntry[] | undefined) ?? [];
      list.forEach((s) => out.push({ ...s, nickname: p.nickname }));
    });
    return out;
  }, [players, historyQueries]);

  const cutoff = Date.now() - period * 86400000;
  const filtered = allHistory.filter((s) => new Date(s.snapshotDate).getTime() >= cutoff);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();
    filtered.forEach((s) => {
      const day = s.snapshotDate.slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, { date: day });
      const row = byDate.get(day)!;
      row[s.playerId] = rankTotalLp(s);
    });
    return Array.from(byDate.values()).sort((a, b) => (a.date as string).localeCompare(b.date as string));
  }, [filtered]);

  // Available days across all history (for intraday selector)
  const availableDays = useMemo(() => {
    const set = new Set<string>();
    allHistory.forEach((s) => {
      const day = (s.createdAt ?? s.snapshotDate).slice(0, 10);
      set.add(day);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allHistory]);

  const effectiveDay = intradayDate || availableDays[0] || "";

  // Intraday: group snapshots of selected day by timestamp, one series per player
  const intradayData = useMemo(() => {
    if (!effectiveDay) return [];
    const rows = new Map<string, Record<string, number | string>>();
    allHistory.forEach((s) => {
      const ts = s.createdAt ?? s.snapshotDate;
      if (!ts.startsWith(effectiveDay)) return;
      const d = new Date(ts);
      const key = ts;
      const label = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      if (!rows.has(key)) rows.set(key, { time: label, ts: d.getTime() });
      rows.get(key)![s.playerId] = rankTotalLp(s);
    });
    return Array.from(rows.values()).sort((a, b) => (a.ts as number) - (b.ts as number));
  }, [allHistory, effectiveDay]);

  // Delta per player on selected day (last - first snapshot)
  const intradayDeltas = useMemo(() => {
    if (!effectiveDay) return [] as { id: string; nickname: string; delta: number; color: string }[];
    return players.map((p, i) => {
      const pts = allHistory
        .filter((s) => s.playerId === p.id && (s.createdAt ?? s.snapshotDate).startsWith(effectiveDay))
        .sort((a, b) => (a.createdAt ?? a.snapshotDate).localeCompare(b.createdAt ?? b.snapshotDate))
        .map((s) => rankTotalLp(s));
      const delta = pts.length >= 2 ? pts[pts.length - 1] - pts[0] : 0;
      return { id: p.id, nickname: p.nickname, delta, color: COLORS[i % COLORS.length] };
    }).filter((d) => d.delta !== 0 || allHistory.some((s) => s.playerId === d.id && (s.createdAt ?? s.snapshotDate).startsWith(effectiveDay)));
  }, [players, allHistory, effectiveDay]);

  const tableRows = filtered
    .filter((s) => selectedPlayer === "all" || s.playerId === selectedPlayer)
    .sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate))
    .slice(0, 50);

  const isLoading = playersQ.isLoading || historyQueries.some((q) => q.isLoading);
  const error = playersQ.error as ApiError | null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Histórico Solo/Duo</h1>
        <p className="text-muted-foreground mt-1">Evolução de pontos ao longo do tempo.</p>
      </header>

      {error ? (
        <Card className="p-10 text-center text-destructive flex flex-col items-center gap-2">
          <AlertCircle className="w-6 h-6" /> {error.message}
        </Card>


      ) : players.length === 0 && !isLoading ? (
        <Card className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
          <LineChartIcon className="w-6 h-6" /> Cadastre jogadores para ver o histórico.
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground mr-2">Período:</span>
              {[{ v: 7 as const, l: "7 dias" }, { v: 30 as const, l: "30 dias" }, { v: 999 as const, l: "Temporada" }].map((o) => (
                <Button key={o.v} variant={period === o.v ? "default" : "outline"} size="sm" onClick={() => setPeriod(o.v)}>{o.l}</Button>
              ))}
            </div>
            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando histórico...</div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">Sem dados no período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.08)" />
                    <XAxis dataKey="date" stroke="hsl(0 0% 100% / 0.5)" fontSize={11} />
                    <YAxis stroke="hsl(0 0% 100% / 0.5)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.03 260)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {players.map((p, i) => (
                      <Line key={p.id} type="monotone" dataKey={p.id} name={p.nickname} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div>
                <h2 className="font-bold text-lg">Evolução intradiária</h2>
                <p className="text-sm text-muted-foreground">Ganho e perda de pontos ao longo do dia.</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Dia:</span>
                <select
                  value={effectiveDay}
                  onChange={(e) => setIntradayDate(e.target.value)}
                  className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {availableDays.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    availableDays.map((d) => (
                      <option key={d} value={d}>{new Date(d + "T12:00:00").toLocaleDateString("pt-BR")}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {intradayDeltas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {intradayDeltas.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/60 border border-border text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="font-medium">{d.nickname}</span>
                    <span className={d.delta > 0 ? "text-success font-semibold" : d.delta < 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                      {d.delta > 0 ? `+${d.delta}` : d.delta} LP
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-80">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Carregando...</div>
              ) : intradayData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">Sem snapshots para o dia selecionado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={intradayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.08)" />
                    <XAxis dataKey="time" stroke="hsl(0 0% 100% / 0.5)" fontSize={11} />
                    <YAxis stroke="hsl(0 0% 100% / 0.5)" fontSize={11} domain={["dataMin - 10", "dataMax + 10"]} />
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.025 260)", border: "1px solid oklch(0.3 0.03 260)", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {players.map((p, i) => (
                      <Line key={p.id} type="monotone" dataKey={p.id} name={p.nickname} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
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
              {tableRows.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">Nenhum snapshot disponível.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="text-left p-3 pl-6">Data</th>
                      <th className="text-left p-3">Jogador</th>
                      <th className="text-left p-3">Elo</th>
                      <th className="text-right p-3">LP Total</th>
                      <th className="text-right p-3 pr-6">V / D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((s, idx) => (
                      <tr key={`${s.playerId}-${idx}`} className="border-t border-border">
                        <td className="p-3 pl-6 text-muted-foreground">{new Date(s.snapshotDate).toLocaleDateString("pt-BR")}</td>
                        <td className="p-3 font-medium">{s.nickname}</td>
                        <td className="p-3"><TierBadge tier={s.tier} rank={s.rank} lp={s.leaguePoints} /></td>
                        <td className="p-3 text-right tabular-nums">{rankTotalLp(s)}</td>
                        <td className="p-3 pr-6 text-right tabular-nums"><span className="text-success">{s.wins}</span>/<span className="text-destructive">{s.losses}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
