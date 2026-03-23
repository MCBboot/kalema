import { Room, createRoom as createRoomModel } from "../models/room.js";
import { Player, createOnlinePlayer } from "../models/player.js";
import { generateId, generateRoomCode } from "../utils/id.js";
import { getGame } from "../games/registry.js";
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
  socketId: string,
): { room: Room; player: Player } {
  const roomId = generateId();
  const code = generateRoomCode();
  const playerId = generateId();

  const player = createOnlinePlayer(playerId, displayName, socketId);
  player.isAdmin = true;

  const room = createRoomModel(roomId, code, playerId);
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

  if (room.status !== "WAITING") {
    throw new Error("ROOM_LOCKED");
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

export function lockRoom(room: Room): void {
  if (room.status !== "WAITING") {
    throw new Error("INVALID_PHASE");
  }
  room.status = "LOCKED";
  room.updatedAt = Date.now();
}

export function unlockRoom(room: Room): void {
  if (room.status !== "LOCKED") {
    throw new Error("INVALID_PHASE");
  }
  room.status = "WAITING";
  room.selectedGame = null;
  room.gameState = null;
  room.updatedAt = Date.now();
}

export function selectGame(room: Room, gameId: string): void {
  if (room.status !== "LOCKED") {
    throw new Error("INVALID_PHASE");
  }

  const game = getGame(gameId);
  if (!game) {
    throw new Error("GAME_NOT_FOUND");
  }

  room.selectedGame = gameId;
  room.gameState = game.createGameState(room);
  room.updatedAt = Date.now();
}

export function startGame(room: Room, config?: unknown): void {
  if (room.status !== "LOCKED") {
    throw new Error("INVALID_PHASE");
  }

  if (!room.selectedGame || !room.gameState) {
    throw new Error("NO_GAME_SELECTED");
  }

  room.status = "PLAYING";
  room.updatedAt = Date.now();
}

export function stopGame(room: Room): void {
  if (room.status !== "PLAYING") {
    throw new Error("INVALID_PHASE");
  }

  const game = getGame(room.selectedGame!);
  if (game?.onStop && room.gameState) {
    game.onStop(room.gameState);
  }

  room.status = "LOCKED";
  room.updatedAt = Date.now();
}

export function getRoomSnapshot(room: Room): object {
  const game = room.selectedGame ? getGame(room.selectedGame) : null;

  return {
    id: room.id,
    code: room.code,
    status: room.status,
    adminPlayerId: room.adminPlayerId,
    players: room.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      type: p.type,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
      socketId: p.socketId,
      joinedAt: p.joinedAt,
    })),
    selectedGame: room.selectedGame,
    gameState: room.gameState && game
      ? game.getPublicState(room.gameState)
      : null,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}
