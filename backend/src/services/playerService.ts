import { Room } from "../models/room.js";
import { Player, createOnlinePlayer, createOfflinePlayer } from "../models/player.js";
import { generateId } from "../utils/id.js";

export function addOnlinePlayer(room: Room, displayName: string, socketId: string): Player {
  const player = createOnlinePlayer(generateId(), displayName, socketId);
  room.players.push(player);
  return player;
}

export function addOfflinePlayer(room: Room, displayName: string): Player {
  const player = createOfflinePlayer(generateId(), displayName);
  room.players.push(player);
  return player;
}

export function removePlayer(room: Room, playerId: string): Player | null {
  const index = room.players.findIndex((p) => p.id === playerId);
  if (index === -1) {
    return null;
  }
  const [removed] = room.players.splice(index, 1);
  return removed;
}

export function findPlayerBySocketId(room: Room, socketId: string): Player | undefined {
  return room.players.find((p) => p.socketId === socketId);
}

export function findPlayerById(room: Room, playerId: string): Player | undefined {
  return room.players.find((p) => p.id === playerId);
}

export function markDisconnected(room: Room, playerId: string): void {
  const player = findPlayerById(room, playerId);
  if (player) {
    player.isConnected = false;
    player.socketId = null;
  }
}

export function markReconnected(room: Room, playerId: string, newSocketId: string): void {
  const player = findPlayerById(room, playerId);
  if (player) {
    player.isConnected = true;
    player.socketId = newSocketId;
  }
}

export function getDisplayNames(room: Room): string[] {
  return room.players.map((p) => p.displayName);
}
