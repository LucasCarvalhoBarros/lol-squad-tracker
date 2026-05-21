export type Tier =
  | "IRON" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "EMERALD"
  | "DIAMOND" | "MASTER" | "GRANDMASTER" | "CHALLENGER";
export type Rank = "IV" | "III" | "II" | "I";
export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | "FILL";

export interface Player {
  id: string;
  nickname: string;
  riotGameName: string;
  riotTagLine: string;
  puuid?: string | null;
  region: string;
  mainRole: Role;
  secondaryRole: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RankEntry {
  id: string;
  playerId: string;
  queueType: string;
  tier: Tier;
  rank: Rank;
  leaguePoints: number;
  wins: number;
  losses: number;
  totalPoints: number;
  rankScore: number;
  snapshotDate: string;
  createdAt?: string;
}

export interface CreatePlayerInput {
  nickname: string;
  riotGameName: string;
  riotTagLine: string;
  region: string;
  mainRole: Role;
  secondaryRole: Role;
  active: boolean;
}
