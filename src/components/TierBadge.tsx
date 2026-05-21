import { tierColor, formatRank } from "@/lib/lol";
import type { Tier, Rank } from "@/lib/types";

export function TierBadge({ tier, rank, lp }: { tier: Tier; rank: Rank; lp: number }) {
  const color = tierColor(tier);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border"
      style={{ color, borderColor: `${color}55`, background: `${color}15` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {formatRank(tier, rank, lp)}
    </span>
  );
}
