import type { Player, Snapshot, Tier, Rank } from "./types";
import { toTotalLp } from "./lol";

export const mockPlayers: Player[] = [
  { id: "1", nickname: "Faker BR", riotId: "ShadowKing", tag: "BR1", region: "BR", primaryRole: "MID", secondaryRole: "TOP", tier: "DIAMOND", rank: "II", lp: 67, wins: 142, losses: 118, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("PLATINUM", "I", 30) },
  { id: "2", nickname: "JungleGod", riotId: "WolfHunter", tag: "BR1", region: "BR", primaryRole: "JUNGLE", secondaryRole: "TOP", tier: "EMERALD", rank: "I", lp: 88, wins: 98, losses: 87, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("EMERALD", "III", 50) },
  { id: "3", nickname: "TopLaneDiff", riotId: "IronWall", tag: "BR1", region: "BR", primaryRole: "TOP", secondaryRole: "SUPPORT", tier: "PLATINUM", rank: "II", lp: 45, wins: 76, losses: 80, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("PLATINUM", "IV", 10) },
  { id: "4", nickname: "ADCarry", riotId: "Sniper", tag: "BR1", region: "BR", primaryRole: "ADC", secondaryRole: "MID", tier: "DIAMOND", rank: "IV", lp: 22, wins: 110, losses: 95, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("DIAMOND", "IV", 0) },
  { id: "5", nickname: "SuppLife", riotId: "Guardian", tag: "BR1", region: "BR", primaryRole: "SUPPORT", secondaryRole: "ADC", tier: "EMERALD", rank: "II", lp: 71, wins: 89, losses: 72, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("EMERALD", "IV", 80) },
  { id: "6", nickname: "MidOrFeed", riotId: "Flashy", tag: "BR1", region: "BR", primaryRole: "MID", secondaryRole: "JUNGLE", tier: "PLATINUM", rank: "III", lp: 12, wins: 60, losses: 68, syncStatus: "syncing", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("PLATINUM", "II", 40) },
  { id: "7", nickname: "Smurfin", riotId: "ZeroFear", tag: "BR1", region: "BR", primaryRole: "JUNGLE", secondaryRole: "MID", tier: "DIAMOND", rank: "III", lp: 54, wins: 132, losses: 100, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("DIAMOND", "IV", 20) },
  { id: "8", nickname: "BotDuoQueen", riotId: "Lethality", tag: "BR1", region: "BR", primaryRole: "ADC", secondaryRole: "SUPPORT", tier: "GOLD", rank: "I", lp: 88, wins: 55, losses: 49, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("GOLD", "III", 30) },
  { id: "9", nickname: "WardMaster", riotId: "VisionPro", tag: "BR1", region: "BR", primaryRole: "SUPPORT", secondaryRole: "TOP", tier: "PLATINUM", rank: "IV", lp: 33, wins: 45, losses: 52, syncStatus: "error", lastSyncAt: new Date(Date.now() - 86400000).toISOString(), startTotalLp: toTotalLp("PLATINUM", "II", 60) },
  { id: "10", nickname: "OldSchool", riotId: "Veteran", tag: "BR1", region: "BR", primaryRole: "TOP", secondaryRole: "JUNGLE", tier: "GOLD", rank: "II", lp: 60, wins: 70, losses: 78, syncStatus: "synced", lastSyncAt: new Date().toISOString(), startTotalLp: toTotalLp("SILVER", "I", 50) },
];

function genSnapshots(p: Player): Snapshot[] {
  const days = 60;
  const end = toTotalLp(p.tier, p.rank, p.lp);
  const start = p.startTotalLp;
  const out: Snapshot[] = [];
  let lp = start;
  for (let i = days; i >= 0; i--) {
    const t = (days - i) / days;
    const target = start + (end - start) * t;
    const noise = (Math.sin(i * 1.3 + p.id.charCodeAt(0)) * 25) + (Math.random() - 0.5) * 15;
    const value = Math.max(0, Math.round(target + noise));
    const delta = value - lp;
    lp = value;
    const date = new Date(Date.now() - i * 86400000).toISOString();
    // Approximate tier/rank from totalLp for display
    const { tier, rank, lpOnly } = fromTotalLp(value);
    out.push({
      playerId: p.id, date, tier, rank, lp: lpOnly,
      wins: Math.round(p.wins * t), losses: Math.round(p.losses * t),
      totalLp: value, delta,
    });
  }
  return out;
}

function fromTotalLp(total: number): { tier: Tier; rank: Rank; lpOnly: number } {
  const tiers: Tier[] = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","EMERALD","DIAMOND","MASTER","GRANDMASTER","CHALLENGER"];
  const tierIdx = Math.min(tiers.length - 1, Math.floor(total / 400));
  const rest = total - tierIdx * 400;
  const rankIdx = Math.min(3, Math.floor(rest / 100));
  const ranks: Rank[] = ["IV","III","II","I"];
  const lpOnly = Math.min(99, rest - rankIdx * 100);
  return { tier: tiers[tierIdx], rank: ranks[rankIdx], lpOnly };
}

export const mockSnapshots: Snapshot[] = mockPlayers.flatMap(genSnapshots);
