import { Server, Socket } from "socket.io";
import {
  CREATE_ROOM,
  JOIN_ROOM,
  LEAVE_ROOM,
  TRANSFER_ADMIN,
  KICK_PLAYER,
  ADD_OFFLINE_PLAYER,
  REMOVE_OFFLINE_PLAYER,
  ADD_WORD,
  START_GAME,
  STOP_GAME,
  ADVANCE_PHASE,
  ROOM_CREATED,
  ROOM_JOINED,
  PLAYER_LIST_UPDATED,
  ADMIN_CHANGED,
  ROOM_STATE_UPDATED,
  WORD_ADDED,
  ACTION_REJECTED,
  GAME_STARTED,
  PHASE_CHANGED,
  ROLE_ASSIGNED,
  GAME_STOPPED,
  SUBMIT_VOTE,
  VOTE_STATE_UPDATED,
  ROUND_RESULT,
  RECONNECT_SESSION,
  SESSION_RECOVERED,
  PLAYER_DISCONNECTED,
  PLAYER_RECONNECTED,
} from "./events.js";
import { validateCreateRoom, validateJoinRoom } from "../validators/roomValidators.js";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomSnapshot,
} from "../services/roomService.js";

import {
  transferAdmin,
  kickPlayer,
  addOfflinePlayer,
  removeOfflinePlayer,
} from "../services/adminService.js";
import { addWord } from "../services/wordService.js";
import {
  startRound,
  stopGame,
  advancePhase,
  getEligibleParticipants,
} from "../services/roundService.js";
import {
  submitVote,
  submitOfflineVote,
  checkAllVoted,
  calculateResult,
} from "../services/voteService.js";
import {
  getSessionBySocket,
  getRoom,
  setSession,
  deleteSession,
} from "../store/memoryStore.js";
import {
  createSession,
  recoverSession,
} from "../services/reconnectService.js";
import { markDisconnected, findPlayerById } from "../services/playerService.js";
import { logInfo, logError } from "../utils/logger.js";

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    logInfo("Socket", `Client connected: ${socket.id}`);

    socket.on(CREATE_ROOM, (payload: unknown) => {
      const result = validateCreateRoom(payload);
      if (!result.valid) {
        socket.emit(ACTION_REJECTED, { event: CREATE_ROOM, reason: result.error });
        return;
      }

      try {
        const { room, player } = createRoom(
          result.data.displayName,
          result.data.adminMode,
          socket.id,
        );

        socket.join(room.id);

        const reconnectToken = createSession(room.id, player.id);

        socket.emit(ROOM_CREATED, {
          room: getRoomSnapshot(room),
          playerId: player.id,
          reconnectToken,
        });

        logInfo("Socket", `Room created: ${room.code} by ${player.displayName}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create room";
        logError("Socket", `create_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: CREATE_ROOM, reason: message });
      }
    });

    socket.on(JOIN_ROOM, (payload: unknown) => {
      const result = validateJoinRoom(payload);
      if (!result.valid) {
        socket.emit(ACTION_REJECTED, { event: JOIN_ROOM, reason: result.error });
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
          playerId: player.id,
          reconnectToken,
        });

        io.to(room.id).emit(PLAYER_LIST_UPDATED, {
          players: room.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            type: p.type,
            isAdmin: p.isAdmin,
            isConnected: p.isConnected,
          })),
        });

        logInfo("Socket", `Player ${player.displayName} joined room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join room";
        logError("Socket", `join_room error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: JOIN_ROOM, reason: message });
      }
    });

    socket.on(LEAVE_ROOM, () => {
      handleExplicitLeave(io, socket);
    });

    socket.on(RECONNECT_SESSION, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("token" in payload)) {
        socket.emit(ACTION_REJECTED, { event: RECONNECT_SESSION, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const { token } = payload as { token: string };

        if (typeof token !== "string" || !token) {
          socket.emit(ACTION_REJECTED, { event: RECONNECT_SESSION, reason: "INVALID_TOKEN" });
          return;
        }

        const result = recoverSession(token, socket.id);
        if (!result) {
          socket.emit(ACTION_REJECTED, { event: RECONNECT_SESSION, reason: "INVALID_TOKEN" });
          return;
        }

        const { room, player, newToken } = result;

        socket.join(room.id);

        socket.emit(SESSION_RECOVERED, {
          room: getRoomSnapshot(room),
          playerId: player.id,
          reconnectToken: newToken,
        });

        io.to(room.id).emit(PLAYER_RECONNECTED, {
          playerId: player.id,
          displayName: player.displayName,
        });

        io.to(room.id).emit(PLAYER_LIST_UPDATED, {
          players: room.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            type: p.type,
            isAdmin: p.isAdmin,
            isConnected: p.isConnected,
          })),
        });

        logInfo("Socket", `Player ${player.displayName} reconnected to room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to recover session";
        logError("Socket", `reconnect_session error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: RECONNECT_SESSION, reason: message });
      }
    });

    socket.on(TRANSFER_ADMIN, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { event: TRANSFER_ADMIN, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: TRANSFER_ADMIN, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: TRANSFER_ADMIN, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        transferAdmin(room, session.playerId, targetPlayerId);

        io.to(room.id).emit(ADMIN_CHANGED, { newAdminPlayerId: targetPlayerId });
        io.to(room.id).emit(ROOM_STATE_UPDATED, { room: getRoomSnapshot(room) });

        logInfo("Socket", `Admin transferred to ${targetPlayerId} in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to transfer admin";
        logError("Socket", `transfer_admin error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: TRANSFER_ADMIN, reason: message });
      }
    });

    socket.on(KICK_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { event: KICK_PLAYER, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: KICK_PLAYER, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: KICK_PLAYER, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        const kicked = kickPlayer(room, session.playerId, targetPlayerId);

        if (kicked.type === "ONLINE" && kicked.socketId) {
          const kickedSocketId = kicked.socketId;
          const kickedSocket = io.sockets.sockets.get(kickedSocketId);
          if (kickedSocket) {
            kickedSocket.emit(ACTION_REJECTED, { event: KICK_PLAYER, reason: "YOU_WERE_KICKED" });
            kickedSocket.leave(room.id);
          }
        }

        io.to(room.id).emit(PLAYER_LIST_UPDATED, {
          players: room.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            type: p.type,
            isAdmin: p.isAdmin,
            isConnected: p.isConnected,
          })),
        });

        logInfo("Socket", `Player ${kicked.displayName} kicked from room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to kick player";
        logError("Socket", `kick_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: KICK_PLAYER, reason: message });
      }
    });

    socket.on(ADD_OFFLINE_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("displayName" in payload)) {
        socket.emit(ACTION_REJECTED, { event: ADD_OFFLINE_PLAYER, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: ADD_OFFLINE_PLAYER, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: ADD_OFFLINE_PLAYER, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { displayName } = payload as { displayName: string };
        const player = addOfflinePlayer(room, session.playerId, displayName);

        io.to(room.id).emit(PLAYER_LIST_UPDATED, {
          players: room.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            type: p.type,
            isAdmin: p.isAdmin,
            isConnected: p.isConnected,
          })),
        });

        logInfo("Socket", `Offline player ${player.displayName} added to room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add offline player";
        logError("Socket", `add_offline_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: ADD_OFFLINE_PLAYER, reason: message });
      }
    });

    socket.on(REMOVE_OFFLINE_PLAYER, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { event: REMOVE_OFFLINE_PLAYER, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: REMOVE_OFFLINE_PLAYER, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: REMOVE_OFFLINE_PLAYER, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId } = payload as { targetPlayerId: string };
        const removed = removeOfflinePlayer(room, session.playerId, targetPlayerId);

        io.to(room.id).emit(PLAYER_LIST_UPDATED, {
          players: room.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            type: p.type,
            isAdmin: p.isAdmin,
            isConnected: p.isConnected,
          })),
        });

        logInfo("Socket", `Offline player ${removed.displayName} removed from room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to remove offline player";
        logError("Socket", `remove_offline_player error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: REMOVE_OFFLINE_PLAYER, reason: message });
      }
    });

    socket.on(ADD_WORD, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("word" in payload)) {
        socket.emit(ACTION_REJECTED, { event: ADD_WORD, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: ADD_WORD, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: ADD_WORD, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { word } = payload as { word: string };
        addWord(room, word);

        io.to(room.id).emit(WORD_ADDED, { words: room.words });

        logInfo("Socket", `Word added to room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add word";
        logError("Socket", `add_word error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: ADD_WORD, reason: message });
      }
    });

    socket.on(START_GAME, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: START_GAME, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: START_GAME, reason: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { event: START_GAME, reason: "UNAUTHORIZED" });
          return;
        }

        const round = startRound(room);

        io.to(room.id).emit(GAME_STARTED, { roomStatus: room.status });
        io.to(room.id).emit(PHASE_CHANGED, { phase: round.phase });

        // Send private role assignments to each online eligible participant
        const eligible = getEligibleParticipants(room);
        for (const player of eligible) {
          if (player.type === "ONLINE" && player.socketId) {
            if (player.id === round.impostorPlayerId) {
              io.to(player.socketId).emit(ROLE_ASSIGNED, { role: "impostor" });
            } else {
              io.to(player.socketId).emit(ROLE_ASSIGNED, { role: "normal", word: round.word });
            }
          }
        }

        logInfo("Socket", `Game started in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start game";
        logError("Socket", `start_game error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: START_GAME, reason: message });
      }
    });

    socket.on(STOP_GAME, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: STOP_GAME, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: STOP_GAME, reason: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { event: STOP_GAME, reason: "UNAUTHORIZED" });
          return;
        }

        stopGame(room);

        io.to(room.id).emit(GAME_STOPPED, { reason: "Admin stopped the game" });

        logInfo("Socket", `Game stopped in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to stop game";
        logError("Socket", `stop_game error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: STOP_GAME, reason: message });
      }
    });

    socket.on(ADVANCE_PHASE, () => {
      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: ADVANCE_PHASE, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: ADVANCE_PHASE, reason: "ROOM_NOT_FOUND" });
          return;
        }

        if (room.adminPlayerId !== session.playerId) {
          socket.emit(ACTION_REJECTED, { event: ADVANCE_PHASE, reason: "UNAUTHORIZED" });
          return;
        }

        const newPhase = advancePhase(room);

        io.to(room.id).emit(PHASE_CHANGED, { phase: newPhase });

        if (newPhase === "WAITING") {
          io.to(room.id).emit(ROOM_STATE_UPDATED, { room: getRoomSnapshot(room) });
        }

        logInfo("Socket", `Phase advanced to ${newPhase} in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to advance phase";
        logError("Socket", `advance_phase error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: ADVANCE_PHASE, reason: message });
      }
    });

    socket.on(SUBMIT_VOTE, (payload: unknown) => {
      if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
        socket.emit(ACTION_REJECTED, { event: SUBMIT_VOTE, reason: "INVALID_PAYLOAD" });
        return;
      }

      try {
        const session = getSessionBySocket(socket.id);
        if (!session) {
          socket.emit(ACTION_REJECTED, { event: SUBMIT_VOTE, reason: "NO_SESSION" });
          return;
        }

        const room = getRoom(session.roomId);
        if (!room) {
          socket.emit(ACTION_REJECTED, { event: SUBMIT_VOTE, reason: "ROOM_NOT_FOUND" });
          return;
        }

        const { targetPlayerId, offlinePlayerId } = payload as {
          targetPlayerId: string;
          offlinePlayerId?: string;
        };

        if (offlinePlayerId) {
          submitOfflineVote(room, session.playerId, offlinePlayerId, targetPlayerId);
        } else {
          submitVote(room, session.playerId, targetPlayerId);
        }

        const eligible = getEligibleParticipants(room);
        io.to(room.id).emit(VOTE_STATE_UPDATED, {
          totalEligible: eligible.length,
          votedCount: room.currentRound!.votes.length,
        });

        if (checkAllVoted(room)) {
          advancePhase(room);
          const result = calculateResult(room);

          io.to(room.id).emit(ROUND_RESULT, result);
          io.to(room.id).emit(PHASE_CHANGED, { phase: room.currentRound!.phase });
        }

        logInfo("Socket", `Vote submitted in room ${room.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to submit vote";
        logError("Socket", `submit_vote error: ${message}`);
        socket.emit(ACTION_REJECTED, { event: SUBMIT_VOTE, reason: message });
      }
    });

    socket.on("disconnect", () => {
      logInfo("Socket", `Client disconnected: ${socket.id}`);
      handleDisconnect(io, socket);
    });
  });
}

function handleDisconnect(io: Server, socket: Socket): void {
  try {
    const session = getSessionBySocket(socket.id);
    if (!session) {
      return;
    }

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

    // Mark as disconnected but keep in room for potential reconnect
    markDisconnected(room, session.playerId);
    room.updatedAt = Date.now();

    deleteSession(socket.id);

    io.to(room.id).emit(PLAYER_DISCONNECTED, {
      playerId: player.id,
      displayName: player.displayName,
    });

    io.to(room.id).emit(PLAYER_LIST_UPDATED, {
      players: room.players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        type: p.type,
        isAdmin: p.isAdmin,
        isConnected: p.isConnected,
      })),
    });

    logInfo("Socket", `Player ${player.displayName} disconnected from room ${room.code}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to handle disconnect";
    logError("Socket", `disconnect error: ${message}`);
  }
}

function handleExplicitLeave(io: Server, socket: Socket): void {
  try {
    const result = leaveRoom(socket.id);
    if (!result) {
      return;
    }

    const { room, player, wasAdmin } = result;

    if (room) {
      socket.leave(room.id);

      io.to(room.id).emit(PLAYER_LIST_UPDATED, {
        players: room.players.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          type: p.type,
          isAdmin: p.isAdmin,
          isConnected: p.isConnected,
        })),
      });

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
