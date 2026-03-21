import { Room } from "../models/room.js";
import { Player } from "../models/player.js";
import { generateId } from "../utils/id.js";
import { RECONNECT_TOKEN_EXPIRY_MS } from "../config/constants.js";
import {
  getReconnectToken,
  setReconnectToken,
  deleteReconnectToken,
  getAllReconnectTokens,
  getRoom,
  setSession,
} from "../store/memoryStore.js";
import { findPlayerById, markReconnected } from "./playerService.js";

export function createSession(roomId: string, playerId: string): string {
  const token = generateId();
  const expiresAt = Date.now() + RECONNECT_TOKEN_EXPIRY_MS;

  setReconnectToken({ token, roomId, playerId, expiresAt });

  return token;
}

export function recoverSession(
  token: string,
  newSocketId: string,
): { room: Room; player: Player; newToken: string } | null {
  const session = getReconnectToken(token);
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    deleteReconnectToken(token);
    return null;
  }

  const room = getRoom(session.roomId);
  if (!room) {
    deleteReconnectToken(token);
    return null;
  }

  const player = findPlayerById(room, session.playerId);
  if (!player) {
    deleteReconnectToken(token);
    return null;
  }

  markReconnected(room, session.playerId, newSocketId);

  deleteReconnectToken(token);

  setSession(newSocketId, { roomId: session.roomId, playerId: session.playerId });

  room.updatedAt = Date.now();

  const newToken = createSession(session.roomId, session.playerId);

  return { room, player, newToken };
}

export function cleanExpiredTokens(): number {
  const tokens = getAllReconnectTokens();
  const now = Date.now();
  let count = 0;

  for (const [key, session] of tokens) {
    if (now > session.expiresAt) {
      deleteReconnectToken(key);
      count++;
    }
  }

  return count;
}
