import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation, useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TierBadge } from "@/components/TierBadge";
import { winrate } from "@/lib/lol";
import { toast } from "sonner";
import { RefreshCw, Trash2, UserPlus, Loader2, AlertCircle, Users, RotateCw } from "lucide-react";
import type { Role, CreatePlayerInput, RankEntry } from "@/lib/types";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Jogadores — LoL Friends Tracker" }] }),
  component: PlayersPage,
});

const ROLES: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT", "FILL"];
const REGIONS = ["BR1", "NA1", "EUW1", "KR", "LA1", "LA2"];

function PlayersPage() {
  const qc = useQueryClient();
  const playersQ = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const players = playersQ.data ?? [];

  const rankQueries = useQueries({
    queries: players.map((p) => ({
      queryKey: ["current-rank", p.id],
      queryFn: () => api.getCurrentRank(p.id),
    })),
  });

  const create = useMutation({
    mutationFn: api.createPlayer,
    onSuccess: () => {
      toast.success("Jogador cadastrado");
      qc.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (e: ApiError) => toast.error(e.message || "Erro ao cadastrar"),
  });
  const del = useMutation({
    mutationFn: api.deletePlayer,
    onSuccess: () => {
      toast.success("Jogador removido");
      qc.invalidateQueries({ queryKey: ["players"] });
    },
    onError: (e: ApiError) => toast.error(e.message || "Erro ao remover"),
  });
  const syncOne = useMutation({
    mutationFn: api.syncPlayer,
    onSuccess: (_d, id) => {
      toast.success("Sincronizado");
      qc.invalidateQueries({ queryKey: ["current-rank", id] });
      qc.invalidateQueries({ queryKey: ["rank-history", id] });
    },
    onError: (e: ApiError) => toast.error(e.message || "Erro ao sincronizar"),
  });
  const syncAll = useMutation({
    mutationFn: api.syncAll,
    onSuccess: () => {
      toast.success("Sincronização disparada para todos");
      qc.invalidateQueries({ queryKey: ["current-rank"] });
      qc.invalidateQueries({ queryKey: ["rank-history"] });
    },
    onError: (e: ApiError) => toast.error(e.message || "Erro ao sincronizar"),
  });

  const [form, setForm] = useState<CreatePlayerInput>({
    nickname: "",
    riotGameName: "",
    riotTagLine: "BR1",
    region: "BR1",
    mainRole: "MID",
    secondaryRole: "FILL",
    active: true,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Jogadores</h1>
          <p className="text-muted-foreground mt-1">Cadastre e acompanhe a galera.</p>
        </div>
        <Button variant="outline" onClick={() => syncAll.mutate()} disabled={syncAll.isPending || players.length === 0}>
          {syncAll.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCw className="w-4 h-4 mr-2" />}
          Sincronizar todos
        </Button>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Cadastrar jogador</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nickname || !form.riotGameName) return;
            create.mutate(form, {
              onSuccess: () => setForm({ ...form, nickname: "", riotGameName: "" }),
            });
          }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <Field label="Apelido"><Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Lucas" required /></Field>
          <Field label="Riot Game Name"><Input value={form.riotGameName} onChange={(e) => setForm({ ...form, riotGameName: e.target.value })} placeholder="LucasCB" required /></Field>
          <Field label="Tag Line"><Input value={form.riotTagLine} onChange={(e) => setForm({ ...form, riotTagLine: e.target.value })} placeholder="BR1" required /></Field>
          <Field label="Região">
            <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Role principal">
            <Select value={form.mainRole} onValueChange={(v) => setForm({ ...form, mainRole: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Role secundária">
            <Select value={form.secondaryRole} onValueChange={(v) => setForm({ ...form, secondaryRole: v as Role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-6 flex items-center justify-between gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              Jogador ativo
            </label>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cadastrar jogador
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {playersQ.isLoading ? (
          <ListState icon={<Loader2 className="w-5 h-5 animate-spin" />} text="Carregando jogadores..." />
        ) : playersQ.error ? (
          <ListState icon={<AlertCircle className="w-5 h-5 text-destructive" />} text={(playersQ.error as ApiError).message || "Erro ao carregar"} />
        ) : players.length === 0 ? (
          <ListState icon={<Users className="w-5 h-5 text-muted-foreground" />} text="Nenhum jogador cadastrado ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3 pl-6">Jogador</th>
                  <th className="text-left p-3">Riot ID</th>
                  <th className="text-left p-3">Elo atual</th>
                  <th className="text-left p-3">Roles</th>
                  <th className="text-right p-3">Winrate</th>
                  <th className="text-right p-3 pr-6">Ações</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const rq = rankQueries[i];
                  const r = (rq?.data as RankEntry | null | undefined) ?? null;
                  const wr = r ? winrate(r.wins, r.losses) : 0;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-3 pl-6 font-medium">{p.nickname}{!p.active && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}</td>
                      <td className="p-3 text-muted-foreground">{p.riotGameName}#{p.riotTagLine} <span className="text-xs">· {p.region}</span></td>
                      <td className="p-3">
                        {rq?.isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> :
                          r ? <TierBadge tier={r.tier} rank={r.rank} lp={r.leaguePoints} /> :
                          <span className="text-xs text-muted-foreground italic">Ainda não sincronizado</span>}
                      </td>
                      <td className="p-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-accent/20 text-accent-foreground">{p.mainRole}</span>{" "}
                        <span className="text-muted-foreground">/ {p.secondaryRole}</span>
                      </td>
                      <td className={`p-3 text-right tabular-nums ${wr >= 50 ? "text-success" : "text-destructive"}`}>
                        {r ? `${wr}%` : "-"}
                      </td>
                      <td className="p-3 pr-6 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncOne.mutate(p.id)}
                            disabled={syncOne.isPending && syncOne.variables === p.id}
                          >
                            {syncOne.isPending && syncOne.variables === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RefreshCw className="w-3.5 h-3.5" />}
                            <span className="ml-1 hidden sm:inline">Sync</span>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ListState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      {icon}<span>{text}</span>
    </div>
  );
}
