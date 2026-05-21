// REST client for the AWS backend.
import type { Player, RankEntry, CreatePlayerInput } from "./types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://yqv7bbhcye.execute-api.us-east-1.amazonaws.com/prod-lol-graphs";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      ...init,
    });
  } catch (e) {
    throw new ApiError("Não foi possível conectar à API. Verifique sua conexão.", 0);
  }
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
      else if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listPlayers: () => request<Player[]>("/players"),
  createPlayer: (input: CreatePlayerInput) =>
    request<Player>("/players", { method: "POST", body: JSON.stringify(input) }),
  updatePlayer: (id: string, patch: Partial<CreatePlayerInput>) =>
    request<Player>(`/players/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deletePlayer: (id: string) =>
    request<void>(`/players/${id}`, { method: "DELETE" }),

  syncPlayer: (id: string) =>
    request<unknown>(`/sync/player/${id}`, { method: "POST" }),
  syncAll: () => request<unknown>("/sync/all", { method: "POST" }),

  // Returns null on 404 (player not yet synced)
  async getCurrentRank(id: string): Promise<RankEntry | null> {
    try {
      return await request<RankEntry>(`/players/${id}/current-rank`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  getRankHistory: (id: string) =>
    request<RankEntry[]>(`/players/${id}/rank-history`),
};
