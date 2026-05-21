import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { rankTotalLp, winrate } from "@/lib/lol";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shuffle, ArrowLeftRight, Swords } from "lucide-react";
import type { Player, RankEntry } from "@/lib/types";

export const Route = createFileRoute("/team-builder")({
  head: () => ({ meta: [{ title: "Times 5x5 — LoL Friends Tracker" }] }),
  component: TeamBuilderPage,
});

function strength(p: Player, r: RankEntry | null | undefined): number {
  const lpScore = rankTotalLp(r);
  const wr = r ? winrate(r.wins, r.losses) : 0;
  return Math.round(lpScore + wr * 4);
}

function balance(players: Player[], ranks: Map<string, RankEntry | null>): { a: Player[]; b: Player[] } {
  const sorted = [...players].sort((p1, p2) => strength(p2, ranks.get(p2.id)) - strength(p1, ranks.get(p1.id)));
  const a: Player[] = []; const b: Player[] = [];
  sorted.forEach((p) => {
    const sumA = a.reduce((s, x) => s + strength(x, ranks.get(x.id)), 0);
    const sumB = b.reduce((s, x) => s + strength(x, ranks.get(x.id)), 0);
    if (a.length >= 5) b.push(p);
    else if (b.length >= 5) a.push(p);
    else if (sumA <= sumB) a.push(p);
    else b.push(p);
  });
  return { a, b };
}

function TeamBuilderPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const rankQueries = useQueries({
    queries: players.map((p) => ({ queryKey: ["current-rank", p.id], queryFn: () => api.getCurrentRank(p.id) })),
  });
  const ranks = useMemo(() => {
    const m = new Map<string, RankEntry | null>();
    players.forEach((p, i) => m.set(p.id, (rankQueries[i]?.data as RankEntry | null | undefined) ?? null));
    return m;
  }, [players, rankQueries]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<{ a: Player[]; b: Player[] } | null>(null);

  const selectedPlayers = useMemo(() => players.filter((p) => selected.has(p.id)), [players, selected]);

  const generate = () => {
    if (selectedPlayers.length !== 10) return;
    setTeams(balance(selectedPlayers, ranks));
  };

  const swap = (player: Player, fromTeam: "a" | "b") => {
    if (!teams) return;
    setTeams({
      a: fromTeam === "a" ? teams.a.filter((p) => p.id !== player.id) : [...teams.a, player],
      b: fromTeam === "b" ? teams.b.filter((p) => p.id !== player.id) : [...teams.b, player],
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    setSelected(next);
  };

  const sumA = teams ? teams.a.reduce((s, p) => s + strength(p, ranks.get(p.id)), 0) : 0;
  const sumB = teams ? teams.b.reduce((s, p) => s + strength(p, ranks.get(p.id)), 0) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3"><Swords className="w-8 h-8 text-primary" />Montar Times 5x5</h1>
        <p className="text-muted-foreground mt-1">Selecione 10 jogadores e gere times balanceados.</p>
      </header>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Selecionar jogadores ({selected.size}/10)</h2>
          <Button onClick={generate} disabled={selectedPlayers.length !== 10}>
            <Shuffle className="w-4 h-4 mr-2" />Gerar times
          </Button>
        </div>
        {players.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Cadastre jogadores primeiro.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {players.map((p) => {
              const isSel = selected.has(p.id);
              return (
                <label key={p.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${isSel ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                  <Checkbox checked={isSel} onCheckedChange={() => toggleSelect(p.id)} />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.nickname}</div>
                    <div className="text-xs text-muted-foreground">{p.mainRole} · {strength(p, ranks.get(p.id))}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Card>

      {teams && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-sm text-muted-foreground">Time A</div>
                <div className="text-3xl font-bold text-primary">{sumA}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Diferença</div>
                <div className={`text-2xl font-bold ${Math.abs(sumA - sumB) < 100 ? "text-success" : "text-warning"}`}>{Math.abs(sumA - sumB)}</div>
                <Button variant="outline" size="sm" onClick={generate} className="mt-2"><Shuffle className="w-3 h-3 mr-1" />Gerar novamente</Button>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Time B</div>
                <div className="text-3xl font-bold text-accent">{sumB}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamCard label="Time A" players={teams.a} ranks={ranks} accent="primary" onSwap={(p) => swap(p, "a")} />
            <TeamCard label="Time B" players={teams.b} ranks={ranks} accent="accent" onSwap={(p) => swap(p, "b")} />
          </div>
        </>
      )}
    </div>
  );
}

function TeamCard({ label, players, ranks, accent, onSwap }: { label: string; players: Player[]; ranks: Map<string, RankEntry | null>; accent: "primary" | "accent"; onSwap: (p: Player) => void }) {
  const color = accent === "primary" ? "text-primary border-primary/30" : "text-accent border-accent/30";
  return (
    <Card className={`p-5 border-t-4 ${color}`}>
      <h3 className={`font-bold text-xl mb-4 ${color.split(" ")[0]}`}>{label}</h3>
      <div className="space-y-2">
        {players.map((p) => {
          const r = ranks.get(p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
              <div className="w-10 h-10 rounded-md bg-card flex items-center justify-center text-xs font-bold">{p.mainRole.slice(0,3)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.nickname}</div>
                <div className="text-xs text-muted-foreground">{r ? `${r.tier} ${r.rank}` : "Sem rank"} · {strength(p, r)} pts</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onSwap(p)} title="Mover para o outro time">
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
