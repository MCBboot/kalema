import { Player } from "./player.js";
import { Round } from "./round.js";

export type RoomStatus =
  | "WAITING"
  | "ROLE_REVEAL"
  | "DISCUSSION"
  | "VOTING"
  | "RESULT"
  | "STOPPED";

export type AdminMode = "ADMIN_ONLY" | "ADMIN_PLAYER";

export interface Room {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  adminPlayerId: string;
  adminMode: AdminMode;
  players: Player[];
  words: string[];
  currentRound: Round | null;
}

export function createRoom(
  id: string,
  code: string,
  adminPlayerId: string,
  adminMode: AdminMode,
  words: string[],
): Room {
  const now = Date.now();
  return {
    id,
    code,
    createdAt: now,
    updatedAt: now,
    status: "WAITING",
    adminPlayerId,
    adminMode,
    players: [],
    words,
    currentRound: null,
  };
}
