import type { GameRegistration } from "./types";

const games = new Map<string, GameRegistration>();

export function registerGame(game: GameRegistration): void {
  games.set(game.id, game);
}

export function getGame(id: string): GameRegistration | undefined {
  return games.get(id);
}

export function getAllGames(): GameRegistration[] {
  return Array.from(games.values());
}
