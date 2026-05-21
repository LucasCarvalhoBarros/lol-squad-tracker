import type { Rank, Tier } from "./types";

const TIER_VALUE: Record<Tier, number> = {
  IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200, PLATINUM: 1600,
  EMERALD: 2000, DIAMOND: 2400, MASTER: 2800, GRANDMASTER: 3200, CHALLENGER: 3600,
};
const RANK_VALUE: Record<Rank, number> = { IV: 0, III: 100, II: 200, I: 300 };

export function toTotalLp(tier: Tier, rank: Rank, lp: number) {
  return TIER_VALUE[tier] + RANK_VALUE[rank] + lp;
}

export function tierColor(tier: Tier): string {
  const map: Record<Tier, string> = {
    IRON: "#7a6a5d", BRONZE: "#a97142", SILVER: "#c0c0c0", GOLD: "#e6c200",
    PLATINUM: "#5fb6a0", EMERALD: "#3ec77a", DIAMOND: "#76d4ff",
    MASTER: "#c463ff", GRANDMASTER: "#ff6b6b", CHALLENGER: "#ffd566",
  };
  return map[tier];
}

export function winrate(w: number, l: number) {
  const t = w + l;
  return t === 0 ? 0 : Math.round((w / t) * 1000) / 10;
}

export function formatRank(tier: Tier, rank: Rank, lp: number) {
  const apex = tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER";
  return apex ? `${tier} ${lp} LP` : `${tier} ${rank} · ${lp} LP`;
}
