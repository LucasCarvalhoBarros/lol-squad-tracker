import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TierBadge } from "@/components/TierBadge";
import { winrate } from "@/lib/lol";
import { CheckCircle2, RefreshCw, AlertCircle, Trash2, UserPlus } from "lucide-react";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Jogadores — LoL Friends Tracker" }] }),
  component: PlayersPage,
});

const ROLES: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT", "FILL"];

function PlayersPage() {
  const qc = useQueryClient();
  const { data: players = [] } = useQuery({ queryKey: ["players"], queryFn: api.listPlayers });
  const create = useMutation({ mutationFn: api.createPlayer, onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }) });
  const del = useMutation({ mutationFn: api.deletePlayer, onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }) });

  const [form, setForm] = useState({ nickname: "", riotId: "", tag: "BR1", region: "BR", primaryRole: "MID" as Role, secondaryRole: "FILL" as Role });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold">Jogadores</h1>
        <p className="text-muted-foreground mt-1">Cadastre e acompanhe a galera.</p>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Cadastrar jogador</h2>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.nickname || !form.riotId) return; create.mutate(form); setForm({ ...form, nickname: "", riotId: "" }); }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <Field label="Apelido"><Input value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Faker BR" required /></Field>
          <Field label="Riot ID"><Input value={form.riotId} onChange={(e) => setForm({ ...form, riotId: e.target.value })} placeholder="ShadowKing" required /></Field>
          <Field label="Tag"><Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></Field>
          <Field label="Região">
            <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["BR","NA","EUW","KR","LAN","LAS"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Role principal">
            <Select value={form.primaryRole} onValueChange={(v) => setForm({ ...form, primaryRole: v as Role })}>
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
          <div className="md:col-span-6 flex justify-end">
            <Button type="submit" disabled={create.isPending}>Cadastrar jogador</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3 pl-6">Jogador</th>
                <th className="text-left p-3">Riot ID</th>
                <th className="text-left p-3">Elo</th>
                <th className="text-left p-3">Roles</th>
                <th className="text-right p-3">Winrate</th>
                <th className="text-left p-3">Sync</th>
                <th className="p-3 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="p-3 pl-6 font-medium">{p.nickname}</td>
                  <td className="p-3 text-muted-foreground">{p.riotId}#{p.tag} <span className="text-xs">· {p.region}</span></td>
                  <td className="p-3"><TierBadge tier={p.tier} rank={p.rank} lp={p.lp} /></td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 rounded bg-accent/20 text-accent-foreground">{p.primaryRole}</span> <span className="text-muted-foreground">/ {p.secondaryRole}</span></td>
                  <td className={`p-3 text-right tabular-nums ${winrate(p.wins, p.losses) >= 50 ? "text-success" : "text-destructive"}`}>{winrate(p.wins, p.losses)}%</td>
                  <td className="p-3"><SyncStatus status={p.syncStatus} /></td>
                  <td className="p-3 pr-6 text-right">
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SyncStatus({ status }: { status: "synced" | "syncing" | "error" }) {
  if (status === "synced") return <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="w-3.5 h-3.5" />Sincronizado</span>;
  if (status === "syncing") return <span className="inline-flex items-center gap-1 text-xs text-warning"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Sincronizando</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" />Erro</span>;
}
