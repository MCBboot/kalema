import { Server, Socket } from "socket.io";
import { getGame, getGameEventMap } from "@kalema/shared";
import { GameEventContext } from "@kalema/shared";
import { getSessionBySocket, getRoom } from "../store/memoryStore.js";
import { ACTION_REJECTED } from "./events.js";
import { logError } from "@kalema/shared/dist/utils/logger.js";

/**
 * Register game-specific socket event handlers.
 * For each registered game, register handlers for its events.
 * The dispatcher looks up the session/room, validates the game matches,
 * then delegates to the game plugin's handleEvent.
 */
export function registerGameHandlers(io: Server, socket: Socket): void {
  const eventMap = getGameEventMap();

  for (const [eventName, gameId] of eventMap) {
    socket.on(eventName, (payload: unknown) => {
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

        if (room.selectedGame !== gameId || !room.gameState) {
          socket.emit(ACTION_REJECTED, { code: "WRONG_GAME", message: "WRONG_GAME" });
          return;
        }

        const game = getGame(gameId);
        if (!game) {
          socket.emit(ACTION_REJECTED, { code: "GAME_NOT_FOUND", message: "GAME_NOT_FOUND" });
          return;
        }

        const ctx: GameEventContext = {
          room,
          playerId: session.playerId,
          emit: (event: string, data: unknown) => socket.emit(event, data),
          broadcast: (event: string, data: unknown) => io.to(room.id).emit(event, data),
          emitTo: (socketId: string, event: string, data: unknown) => io.to(socketId).emit(event, data),
        };

        game.handleEvent(ctx, eventName, payload);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Game event error";
        logError("GameDispatcher", `${eventName} error: ${message}`);
        socket.emit(ACTION_REJECTED, { code: message, message });
      }
    });
  }
}
