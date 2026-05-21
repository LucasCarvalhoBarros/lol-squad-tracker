import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toTotalLp, winrate } from "@/lib/lol";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shuffle, ArrowLeftRight, Swords } from "lucide-react";
import type { Player } from "@/lib/types";

export const Route = createFileRoute("/team-builder")({
  head: () => ({ meta: [{ title: "Times 5x5 — LoL Friends Tracker" }] }),
  component: TeamBuilderPage,
});

function strength(p: Player, recentDelta = 0): number {
  const lpScore = toTotalLp(p.tier, p.rank, p.lp);
  const wr = winrate(p.wins, p.losses);
  return Math.round(lpScore + wr * 4 + recentDelta * 1.5);
}

function balance(players: Player[], seed = 0): { a: Player[]; b: Player[] } {
  // Sort by strength desc, alternate snake draft with seed-based reshuffling on ties
  const sorted = [...players].sort((p1, p2) => strength(p2) - strength(p1) + (seed * (p2.id.charCodeAt(0) - p1.id.charCodeAt(0)) * 0.0001));
  const a: Player[] = []; const b: Player[] = [];
  sorted.forEach((p, i) => {
    const sumA = a.reduce((s, x) => s + strength(x), 0);
    const sumB = b.reduce((s, x) => s + strength(x), 0);
    if (a.length >= 5) b.push(p);
    else if (b.length >= 5) a.push(p);
    else if (sumA <= sumB) a.push(p);
    else b.push(p);
    void i;
  });
  return { a, b };
}

function TeamBuilderPage() {
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seed, setSeed] = useState(0);
  const [teams, setTeams] = useState<{ a: Player[]; b: Player[] } | null>(null);

  const selectedPlayers = useMemo(() => players.filter((p) => selected.has(p.id)), [players, selected]);

  const generate = () => {
    if (selectedPlayers.length !== 10) return;
    setTeams(balance(selectedPlayers, seed));
    setSeed((s) => s + 1);
  };

  const swap = (player: Player, fromTeam: "a" | "b") => {
    if (!teams) return;
    const target: "a" | "b" = fromTeam === "a" ? "b" : "a";
    setTeams({
      a: fromTeam === "a" ? teams.a.filter((p) => p.id !== player.id) : [...teams.a, player],
      b: target === "a" ? teams.b.filter((p) => p.id !== player.id) : [...teams.b, player],
    });
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < 10) next.add(id);
    setSelected(next);
  };

  const sumA = teams ? teams.a.reduce((s, p) => s + strength(p), 0) : 0;
  const sumB = teams ? teams.b.reduce((s, p) => s + strength(p), 0) : 0;

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {players.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <label key={p.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${isSel ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/40"}`}>
                <Checkbox checked={isSel} onCheckedChange={() => toggleSelect(p.id)} />
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.nickname}</div>
                  <div className="text-xs text-muted-foreground">{p.primaryRole} · {strength(p)}</div>
                </div>
              </label>
            );
          })}
        </div>
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
            <TeamCard label="Time A" players={teams.a} accent="primary" onSwap={(p) => swap(p, "a")} />
            <TeamCard label="Time B" players={teams.b} accent="accent" onSwap={(p) => swap(p, "b")} />
          </div>
        </>
      )}
    </div>
  );
}

function TeamCard({ label, players, accent, onSwap }: { label: string; players: Player[]; accent: "primary" | "accent"; onSwap: (p: Player) => void }) {
  const color = accent === "primary" ? "text-primary border-primary/30" : "text-accent border-accent/30";
  return (
    <Card className={`p-5 border-t-4 ${color}`}>
      <h3 className={`font-bold text-xl mb-4 ${color.split(" ")[0]}`}>{label}</h3>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
            <div className="w-10 h-10 rounded-md bg-card flex items-center justify-center text-xs font-bold">{p.primaryRole.slice(0,3)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.nickname}</div>
              <div className="text-xs text-muted-foreground">{p.tier} {p.rank} · {strength(p)} pts</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => onSwap(p)} title="Mover para o outro time">
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
