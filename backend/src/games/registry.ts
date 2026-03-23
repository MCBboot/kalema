import { GameDefinition } from "./types.js";

const games = new Map<string, GameDefinition>();

export function registerGame(game: GameDefinition): void {
  if (games.has(game.id)) {
    throw new Error(`Game "${game.id}" is already registered`);
  }
  games.set(game.id, game);
}

export function getGame(id: string): GameDefinition | undefined {
  return games.get(id);
}

export function getAllGames(): GameDefinition[] {
  return Array.from(games.values());
}

/** Build a map of event name -> game id for routing */
export function getGameEventMap(): Map<string, string> {
  const eventMap = new Map<string, string>();
  for (const game of games.values()) {
    for (const eventName of game.getEventNames()) {
      eventMap.set(eventName, game.id);
    }
  }
  return eventMap;
}
