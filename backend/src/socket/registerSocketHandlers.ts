import { Server, Socket } from "socket.io";
import {
  CREATE_ROOM,
  JOIN_ROOM,
  LEAVE_ROOM,
  RECONNECT_SESSION,
  TRANSFER_ADMIN,
  KICK_PLAYER,
  ADD_OFFLINE_PLAYER,
  REMOVE_OFFLINE_PLAYER,
  LOCK_ROOM,
  UNLOCK_ROOM,
  SELECT_GAME,
  START_GAME,
  STOP_GAME,
  ROOM_CREATED,
  ROOM_JOINED,
  PLAYER_LIST_UPDATED,
  ADMIN_CHANGED,
  ROOM_STATE_UPDATED,
  GAME_SELECTED,
  GAME_STARTED,
  GAME_STOPPED,
  ACTION_REJECTED,
  SESSION_RECOVERED,
  PLAYER_DISCONNECTED,
  PLAYER_RECONNECTED,
} from "./events.js";
import { validateCreateRoom, validateJoinRoom } from "../validators/roomValidators.js";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  lockRoom,
  unlockRoom,
  selectGame,
  startGame,
  stopGame,
  getRoomSnapshot,
} from "../services/roomService.js";
import {
  transferAdmin,
  kickPlayer,
  addOfflinePlayer,
  removeOfflinePlayer,
} from "../services/adminService.js";
import { getGame } from "@kalema/shared";
import {
  getSessionBySocket,
  getRoom,
  deleteSession,
} from "../store/memoryStore.js";
import {
  createSession,
  recoverSession,
} from "../services/reconnectService.js";
import { markDisconnected, findPlayerById } from "../services/playerService.js";
import { registerGameHandlers } from "./gameDispatcher.js";
import { logInfo, logError } from "@kalema/shared/dist/utils/logger.js";

function emitPlayerList(io: Server, room: { id: string; players: Array<{ id: string; displayName: string; type: string; isAdmin: boolean; isConnected: boolean }> }): void {
  io.to(room.id).emit(PLAYER_LIST_UPDATED, {
    players: room.players.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      type: p.type,
      isAdmin: p.isAdmin,
      isConnected: p.isConnected,
    })),
  });
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    logInfo("Socket", `Client connected: ${socket.id}`);

    // Register game-specific event handlers
    registerGameHandlers(io, socket);

    // ── Room Management ──

    socket.on(CREATE_ROOM, (payload: unknown) => {
      const result = validateCreateRoom(payload);
      if (!result.valid) {
        socket.emit(ACTION_REJECTED, { code: result.code, message: result.error });
        return;
      }

      try {
        const { room, player } = createRoom(
          result.data.displayName,
          socket.id,
        );

        socket.join(room.id);
        const reconnectToken = createSession(room.id, player.id);

        socket.emit(ROOM_CREATED, {
          room: getRoomSnapshot(room),
          player: { id: player.id, displayName: player.displayName },
          reconnectToken,
        });

        logInfo("Socket", `Room created: ${room.code} by ${player.displayName}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create room";
        logError("Socket", `create_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(JOIN_ROOM, (payload: unknown) => {
      const result = validateJoinRoom(payload);
      if (!result.valid) {
        socket.emit(ACTION_REJECTED, { code: result.code, message: result.error });
        return;
      }

      try {
        const { room, player } = joinRoom(
          result.data.code,
          result.data.displayName,
          socket.id,
        );

        socket.join(room.id);
        const reconnectToken = createSession(room.id, player.id);

        socket.emit(ROOM_JOINED, {
          room: getRoomSnapshot(room),
          player: { id: player.id, displayName: player.displayName },
          reconnectToken,
        });

        emitPlayerList(io, room);
        logInfo("Socket", `Player ${player.displayName} joined room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join room";
        logError("Socket", `join_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(LEAVE_ROOM, () => {
      handleExplicitLeave(io, socket);
    });

    socket.on(RECONNECT_SESSION, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("token" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const { token } = payload as { token: string };

        if (typeof token !== "string" || !token) {
          socket.emit(ACTION_REJECTED, { code: "INVALID_TOKEN", message: "INVALID_TOKEN" });
          return;
        }

        const result = recoverSession(token, socket.id);
        if (!result) {
          socket.emit(ACTION_REJECTED, { code: "INVALID_TOKEN", message: "INVALID_TOKEN" });
          return;
        }

        const { room, player, newToken } = result;
        socket.join(room.id);

        // Build game-specific private data if game is active
        let gamePlayerData: unknown = undefined;
        if (room.selectedGame && room.gameState) {
          const game = getGame(room.selectedGame);
          if (game) {
            gamePlayerData = game.getPlayerPrivateData(room.gameState, player.id);
          }
        }

        socket.emit(SESSION_RECOVERED, {
          room: getRoomSnapshot(room),
          playerId: player.id,
          displayName: player.displayName,
          reconnectToken: newToken,
          gamePlayerData,
        });

        // Also emit game_player_data separately so the game component picks it up
        if (gamePlayerData) {
          socket.emit("game_player_data", { data: gamePlayerData });
        }

        io.to(room.id).emit(PLAYER_RECONNECTED, {
          playerId: player.id,
          displayName: player.displayName,
        });

        emitPlayerList(io, room);
        logInfo("Socket", `Player ${player.displayName} reconnected to room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to recover session";
        logError("Socket", `reconnect_session error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    // ── Admin Actions ──

    socket.on(TRANSFER_ADMIN, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        transferAdmin(room, session.playerId, targetPlayerId);

        io.to(room.id).emit(ADMIN_CHANGED, { newAdminId: targetPlayerId });
        io.to(room.id).emit(ROOM_STATE_UPDATED, getRoomSnapshot(room));

        logInfo("Socket", `Admin transferred to ${targetPlayerId} in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to transfer admin";
        logError("Socket", `transfer_admin error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(KICK_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        const kicked = kickPlayer(room, session.playerId, targetPlayerId);

        if (kicked.type === "ONLINE" && kicked.socketId) {
          const kickedSocket = io.sockets.sockets.get(kicked.socketId);
          if (kickedSocket) {
            kickedSocket.emit(ACTION_REJECTED, { code: "YOU_WERE_KICKED", message: "YOU_WERE_KICKED" });
            kickedSocket.leave(room.id);
          }
        }

        emitPlayerList(io, room);
        logInfo("Socket", `Player ${kicked.displayName} kicked from room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to kick player";
        logError("Socket", `kick_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(ADD_OFFLINE_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("displayName" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        const { displayName } = payload as { displayName: string };
        const player = addOfflinePlayer(room, session.playerId, displayName);

        emitPlayerList(io, room);
        logInfo("Socket", `Offline player ${player.displayName} added to room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add offline player";
        logError("Socket", `add_offline_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(REMOVE_OFFLINE_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        const removed = removeOfflinePlayer(room, session.playerId, targetPlayerId);

        emitPlayerList(io, room);
        logInfo("Socket", `Offline player ${removed.displayName} removed from room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove offline player";
        logError("Socket", `remove_offline_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    // ── Room Lifecycle ──

    socket.on(LOCK_ROOM, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        lockRoom(room);
        io.to(room.id).emit(ROOM_STATE_UPDATED, getRoomSnapshot(room));
        logInfo("Socket", `Room ${room.code} locked for game selection`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to lock room";
        logError("Socket", `lock_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(UNLOCK_ROOM, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        unlockRoom(room);
        io.to(room.id).emit(ROOM_STATE_UPDATED, getRoomSnapshot(room));
        logInfo("Socket", `Room ${room.code} unlocked, back to waiting`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unlock room";
        logError("Socket", `unlock_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(SELECT_GAME, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("gameId" in payload)) {
        socket.emit(ACTION_REJECTED, { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        const { gameId } = payload as { gameId: string };
        selectGame(room, gameId);

        io.to(room.id).emit(GAME_SELECTED, { gameId });
        io.to(room.id).emit(ROOM_STATE_UPDATED, getRoomSnapshot(room));
        logInfo("Socket", `Game "${gameId}" selected in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to select game";
        logError("Socket", `select_game error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(START_GAME, (payload?: unknown) => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        if (!room.selectedGame || !room.gameState) {
          socket.emit(ACTION_REJECTED, { code: "NO_GAME_SELECTED", message: "NO_GAME_SELECTED" });
          return;
        }

        const game = getGame(room.selectedGame);
        if (!game) {
          socket.emit(ACTION_REJECTED, { code: "GAME_NOT_FOUND", message: "GAME_NOT_FOUND" });
          return;
        }

        startGame(room);

        io.to(room.id).emit(GAME_STARTED, {
          roomStatus: room.status,
          gameState: game.getPublicState(room.gameState),
        });

        // Send private game data to each eligible player
        const eligible = game.getEligibleParticipants(room);
        for (const player of eligible) {
          if (player.type === "ONLINE" && player.socketId) {
            const privateData = game.getPlayerPrivateData(room.gameState, player.id);
            if (privateData) {
              io.to(player.socketId).emit("game_player_data", { data: privateData });
            }
          }
        }

        logInfo("Socket", `Game started in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start game";
        logError("Socket", `start_game error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    socket.on(STOP_GAME, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { code: "NO_SESSION", message: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { code: "ROOM_NOT_FOUND", message: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        stopGame(room);
        io.to(room.id).emit(GAME_STOPPED, getRoomSnapshot(room));
        logInfo("Socket", `Game stopped in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to stop game";
        logError("Socket", `stop_game error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });

    // ── Disconnect ──

    socket.on("disconnect", () => {
      logInfo("Socket", `Client disconnected: ${socket.id}`);
      handleDisconnect(io, socket);
    });

    // ── WebRTC Signaling Events ──

    socket.on("webrtc_offer", (payload: any) => {
      const session = getSessionBySocket(socket.id);
      if (!session) return;
      const room = getRoom(session.roomId);
      if (!room) return;
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (targetPlayer && targetPlayer.socketId) {
        io.to(targetPlayer.socketId).emit("webrtc_offer", {
          sourcePlayerId: session.playerId,
          payload: payload.offer,
        });
      }
    });

    socket.on("webrtc_answer", (payload: any) => {
      const session = getSessionBySocket(socket.id);
      if (!session) return;
      const room = getRoom(session.roomId);
      if (!room) return;
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (targetPlayer && targetPlayer.socketId) {
        io.to(targetPlayer.socketId).emit("webrtc_answer", {
          sourcePlayerId: session.playerId,
          payload: payload.answer,
        });
      }
    });

    socket.on("webrtc_ice_candidate", (payload: any) => {
      const session = getSessionBySocket(socket.id);
      if (!session) return;
      const room = getRoom(session.roomId);
      if (!room) return;
      const targetPlayer = room.players.find(p => p.id === payload.targetPlayerId);
      if (targetPlayer && targetPlayer.socketId) {
        io.to(targetPlayer.socketId).emit("webrtc_ice_candidate", {
          sourcePlayerId: session.playerId,
          payload: payload.candidate,
        });
      }
    });
  });
}

function handleDisconnect(io: Server, socket: Socket): void {
  try {
    const session = getSessionBySocket(socket.id);
    if (!session) return;

    const room = getRoom(session.roomId);
    if (!room) {
      deleteSession(socket.id);
      return;
    }

    const player = findPlayerById(room, session.playerId);
    if (!player || !player.isConnected) {
      deleteSession(socket.id);
      return;
    }

    markDisconnected(room, session.playerId);
    room.updatedAt = Date.now();
    deleteSession(socket.id);

    io.to(room.id).emit(PLAYER_DISCONNECTED, {
      playerId: player.id,
      displayName: player.displayName,
    });

    emitPlayerList(io, room);
    logInfo("Socket", `Player ${player.displayName} disconnected from room ${room.code}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to handle disconnect";
    logError("Socket", `disconnect error: ${message}`);
  }
}

function handleExplicitLeave(io: Server, socket: Socket): void {
  try {
    const result = leaveRoom(socket.id);
    if (!result) return;

    const { room, player, wasAdmin } = result;

    if (room) {
      socket.leave(room.id);
      emitPlayerList(io, room);

      if (wasAdmin) {
        io.to(room.id).emit(ADMIN_CHANGED, {
          newAdminPlayerId: room.adminPlayerId,
        });
      }
    }

    logInfo("Socket", `Player ${player.displayName} left room`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to leave room";
    logError("Socket", `leave error: ${message}`);
  }
}
