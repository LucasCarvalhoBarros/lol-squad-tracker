export type Tier = "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "EMERALD" | "DIAMOND" | "MASTER" | "GRANDMASTER" | "CHALLENGER";
export type Rank = "IV" | "III" | "II" | "I";
export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | "FILL";

export interface Player {
  id: string;
  nickname: string;
  riotId: string;
  tag: string;
  region: string;
  primaryRole: Role;
  secondaryRole: Role;
  tier: Tier;
  rank: Rank;
  lp: number;
  wins: number;
  losses: number;
  syncStatus: "synced" | "syncing" | "error";
  lastSyncAt: string;
  startTotalLp: number; // total LP when tracking started
}

export interface Snapshot {
  playerId: string;
  date: string; // ISO
  tier: Tier;
  rank: Rank;
  lp: number;
  wins: number;
  losses: number;
  totalLp: number;
  delta: number;
}
