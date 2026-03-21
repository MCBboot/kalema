import { Room, AdminMode, createRoom as createRoomModel } from "../models/room.js";
import { Player, createOnlinePlayer } from "../models/player.js";
import { generateId, generateRoomCode } from "../utils/id.js";
import { getDefaultWords } from "./wordService.js";
import {
  setRoom,
  getRoom,
  getRoomByCode,
  deleteRoom as deleteRoomFromStore,
  setSession,
  getSessionBySocket,
  deleteSession,
} from "../store/memoryStore.js";
import { getDisplayNames, removePlayer, findPlayerBySocketId } from "./playerService.js";

export function createRoom(
  displayName: string,
  adminMode: AdminMode,
  socketId: string,
): { room: Room; player: Player } {
  const roomId = generateId();
  const code = generateRoomCode();
  const playerId = generateId();

  const player = createOnlinePlayer(playerId, displayName, socketId);
  player.isAdmin = true;

  const words = getDefaultWords();
  const room = createRoomModel(roomId, code, playerId, adminMode, words);
  room.players.push(player);

  setRoom(room);
  setSession(socketId, { roomId, playerId });

  return { room, player };
}

export function joinRoom(
  code: string,
  displayName: string,
  socketId: string,
): { room: Room; player: Player } {
  const room = getRoomByCode(code);
  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }

  const existingNames = getDisplayNames(room);
  if (existingNames.includes(displayName)) {
    throw new Error("DUPLICATE_NAME");
  }

  const playerId = generateId();
  const player = createOnlinePlayer(playerId, displayName, socketId);
  room.players.push(player);
  room.updatedAt = Date.now();

  setSession(socketId, { roomId: room.id, playerId });

  return { room, player };
}

export function leaveRoom(
  socketId: string,
): { room: Room | null; player: Player; wasAdmin: boolean } | null {
  const session = getSessionBySocket(socketId);
  if (!session) {
    return null;
  }

  const room = getRoom(session.roomId);
  if (!room) {
    deleteSession(socketId);
    return null;
  }

  const player = findPlayerBySocketId(room, socketId);
  if (!player) {
    deleteSession(socketId);
    return null;
  }

  const wasAdmin = player.isAdmin;
  removePlayer(room, player.id);
  deleteSession(socketId);

  if (room.players.length === 0) {
    deleteRoomFromStore(room.id);
    return { room: null, player, wasAdmin };
  }

  if (wasAdmin) {
    const onlinePlayers = room.players
      .filter((p) => p.isConnected && p.type === "ONLINE")
      .sort((a, b) => a.joinedAt - b.joinedAt);

    const newAdmin = onlinePlayers[0] || room.players[0];
    newAdmin.isAdmin = true;
    room.adminPlayerId = newAdmin.id;
  }

  room.updatedAt = Date.now();

  return { room, player, wasAdmin };
}

export function getRoomSnapshot(room: Room): object {
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    adminPlayerId: room.adminPlayerId,
    adminMode: room.adminMode,
    players: room.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      type: p.type,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
      socketId: p.socketId,
      joinedAt: p.joinedAt,
    })),
    words: room.words,
    currentRound: room.currentRound
      ? {
          id: room.currentRound.id,
          phase: room.currentRound.phase,
          votes: room.currentRound.votes,
          startedAt: room.currentRound.startedAt,
          // word and impostorPlayerId intentionally omitted — secret data
        }
      : null,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}
