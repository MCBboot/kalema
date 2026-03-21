import { Room } from "../models/room.js";
import { Player, createOfflinePlayer } from "../models/player.js";
import { generateId } from "../utils/id.js";
import { validateDisplayName } from "../validators/playerValidators.js";
import { getDisplayNames } from "./playerService.js";

export function transferAdmin(
  room: Room,
  currentAdminId: string,
  targetPlayerId: string,
): void {
  if (room.adminPlayerId !== currentAdminId) {
    throw new Error("UNAUTHORIZED");
  }

  if (targetPlayerId === currentAdminId) {
    throw new Error("INVALID_TARGET");
  }

  const target = room.players.find((p) => p.id === targetPlayerId);
  if (!target) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const oldAdmin = room.players.find((p) => p.id === currentAdminId);
  if (oldAdmin) {
    oldAdmin.isAdmin = false;
  }

  target.isAdmin = true;
  room.adminPlayerId = targetPlayerId;
  room.updatedAt = Date.now();
}

export function kickPlayer(
  room: Room,
  adminId: string,
  targetPlayerId: string,
): Player {
  if (room.adminPlayerId !== adminId) {
    throw new Error("UNAUTHORIZED");
  }

  if (targetPlayerId === adminId) {
    throw new Error("CANNOT_KICK_ADMIN");
  }

  const index = room.players.findIndex((p) => p.id === targetPlayerId);
  if (index === -1) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const [removed] = room.players.splice(index, 1);
  room.updatedAt = Date.now();
  return removed;
}

export function addOfflinePlayer(
  room: Room,
  adminId: string,
  displayName: string,
): Player {
  if (room.adminPlayerId !== adminId) {
    throw new Error("UNAUTHORIZED");
  }

  const existingNames = getDisplayNames(room);
  const result = validateDisplayName(displayName, existingNames);
  if (!result.valid) {
    throw new Error(result.code);
  }

  const player = createOfflinePlayer(generateId(), result.name);
  room.players.push(player);
  room.updatedAt = Date.now();
  return player;
}

export function removeOfflinePlayer(
  room: Room,
  adminId: string,
  targetPlayerId: string,
): Player {
  if (room.adminPlayerId !== adminId) {
    throw new Error("UNAUTHORIZED");
  }

  const index = room.players.findIndex((p) => p.id === targetPlayerId);
  if (index === -1) {
    throw new Error("PLAYER_NOT_FOUND");
  }

  const target = room.players[index];
  if (target.type !== "OFFLINE") {
    throw new Error("PLAYER_NOT_OFFLINE");
  }

  const [removed] = room.players.splice(index, 1);
  room.updatedAt = Date.now();
  return removed;
}
