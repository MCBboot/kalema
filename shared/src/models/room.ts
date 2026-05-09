import { Player } from "./player.js";
import { GameState } from "../games/types.js";

export type RoomStatus = "WAITING" | "LOCKED" | "PLAYING";

export interface Room {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  adminPlayerId: string;
  players: Player[];
  selectedGame: string | null;
  gameState: GameState | null;
}

export function createRoom(
  id: string,
  code: string,
  adminPlayerId: string,
): Room {
  const now = Date.now();
  return {
    id,
    code,
    createdAt: now,
    updatedAt: now,
    status: "WAITING",
    adminPlayerId,
    players: [],
    selectedGame: null,
    gameState: null,
  };
}
