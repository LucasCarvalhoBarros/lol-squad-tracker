// API client layer — currently returns mock data, ready to be swapped for AWS REST.
import type { Player, Snapshot } from "./types";
import { mockPlayers, mockSnapshots } from "./mock-data";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const USE_MOCKS = !BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

let playersStore = [...mockPlayers];

export const api = {
  listPlayers(): Promise<Player[]> {
    return USE_MOCKS ? delay(playersStore) : request("/players");
  },
  getPlayer(id: string): Promise<Player | undefined> {
    return USE_MOCKS ? delay(playersStore.find((p) => p.id === id)) : request(`/players/${id}`);
  },
  createPlayer(p: Omit<Player, "id" | "tier" | "rank" | "lp" | "wins" | "losses" | "syncStatus" | "lastSyncAt" | "startTotalLp">): Promise<Player> {
    if (USE_MOCKS) {
      const np: Player = {
        ...p, id: crypto.randomUUID(),
        tier: "GOLD", rank: "IV", lp: 0, wins: 0, losses: 0,
        syncStatus: "syncing", lastSyncAt: new Date().toISOString(), startTotalLp: 1200,
      };
      playersStore = [...playersStore, np];
      return delay(np);
    }
    return request("/players", { method: "POST", body: JSON.stringify(p) });
  },
  deletePlayer(id: string): Promise<void> {
    if (USE_MOCKS) { playersStore = playersStore.filter((p) => p.id !== id); return delay(undefined); }
    return request(`/players/${id}`, { method: "DELETE" });
  },
  listSnapshots(): Promise<Snapshot[]> {
    return USE_MOCKS ? delay(mockSnapshots) : request("/snapshots");
  },
};
