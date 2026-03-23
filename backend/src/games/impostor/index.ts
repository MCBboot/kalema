import { GameDefinition, GameEventContext, GameState } from "../types.js";
import { Room } from "../../models/room.js";
import { Player } from "../../models/player.js";
import { ImpostorGameState, ImpostorData, AdminMode } from "./state.js";
import { getDefaultWords, loadImpostorWords, addWord } from "./words.js";
import { startRound, advancePhase, stopRound, skipToVoting, markTurnDone, addVoteRequest, restartFreeRound } from "./round.js";
import {
  submitVote,
  submitOfflineVote,
  checkAllVoted,
  calculateResult,
} from "./vote.js";
import {
  IMPOSTOR_SET_ADMIN_MODE,
  IMPOSTOR_START_ROUND,
  IMPOSTOR_ADVANCE_PHASE,
  IMPOSTOR_SUBMIT_VOTE,
  IMPOSTOR_ADD_WORD,
  IMPOSTOR_MARK_TURN_DONE,
  IMPOSTOR_REQUEST_VOTE,
  IMPOSTOR_RESTART_FREE_ROUND,
  IMPOSTOR_ROLE_ASSIGNED,
  IMPOSTOR_PHASE_CHANGED,
  IMPOSTOR_VOTE_STATE_UPDATED,
  IMPOSTOR_ROUND_RESULT,
  IMPOSTOR_WORD_ADDED,
  IMPOSTOR_TURN_UPDATED,
  IMPOSTOR_VOTE_REQUESTS_UPDATED,
  IMPOSTOR_CLIENT_EVENTS,
} from "./events.js";
import { logInfo } from "../../utils/logger.js";

function getEligibleParticipants(room: Room, state: ImpostorGameState): Player[] {
  return room.players.filter((p) => {
    if (p.type === "OFFLINE") return true;
    if (!p.isConnected) return false;
    if (state.data.adminMode === "ADMIN_ONLY" && p.id === room.adminPlayerId) return false;
    return true;
  });
}

function asImpostorState(state: GameState): ImpostorGameState {
  return state as ImpostorGameState;
}

function buildTurnUpdatePayload(state: ImpostorGameState) {
  const round = state.data.currentRound!;
  const allTurnsDone = round.currentTurnIndex >= round.turnOrder.length;
  return {
    turnOrder: round.turnOrder,
    currentTurnIndex: round.currentTurnIndex,
    askedPlayerIds: round.askedPlayerIds,
    allTurnsDone,
    // Circle pattern: current player asks the next player in the order
    currentAskerId: !allTurnsDone ? round.turnOrder[round.currentTurnIndex] : null,
    currentAnswererId: !allTurnsDone ? round.turnOrder[(round.currentTurnIndex + 1) % round.turnOrder.length] : null,
  };
}

/** Broadcast updated game state to all players in the room */
function broadcastState(ctx: GameEventContext, state: ImpostorGameState) {
  ctx.broadcast("game_state_updated", {
    gameState: impostorGame.getPublicState(state),
  });
}

export const impostorGame: GameDefinition = {
  id: "impostor",
  minPlayers: 3,
  maxPlayers: 50,

  createGameState(_room: Room, _config?: unknown): ImpostorGameState {
    const words = getDefaultWords();

    return {
      gameId: "impostor",
      phase: "CHOOSING",
      data: {
        adminMode: "ADMIN_PLAYER",
        words,
        currentRound: null,
      },
    };
  },

  handleEvent(ctx: GameEventContext, eventName: string, payload: unknown): void {
    const state = asImpostorState(ctx.room.gameState!);
    const eligible = getEligibleParticipants(ctx.room, state);

    switch (eventName) {
      case IMPOSTOR_SET_ADMIN_MODE: {
        if (ctx.room.adminPlayerId !== ctx.playerId) {
          ctx.emit("action_rejected", { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        if (!payload || typeof payload !== "object" || !("adminMode" in payload)) {
          ctx.emit("action_rejected", { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
          return;
        }

        const { adminMode } = payload as { adminMode: string };
        if (adminMode !== "ADMIN_ONLY" && adminMode !== "ADMIN_PLAYER") {
          ctx.emit("action_rejected", { code: "INVALID_ADMIN_MODE", message: "INVALID_ADMIN_MODE" });
          return;
        }

        state.data.adminMode = adminMode as AdminMode;
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);

        logInfo("Impostor", `Admin mode set to ${adminMode} in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_START_ROUND: {
        if (ctx.room.adminPlayerId !== ctx.playerId) {
          ctx.emit("action_rejected", { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        const selectedWord = payload && typeof payload === "object" && "word" in payload
          ? String((payload as { word: string }).word)
          : undefined;

        const round = startRound(state, eligible, selectedWord);
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_PHASE_CHANGED, { phase: round.phase });

        for (const player of eligible) {
          if (player.type === "ONLINE" && player.socketId) {
            if (player.id === round.impostorPlayerId) {
              ctx.emitTo(player.socketId, IMPOSTOR_ROLE_ASSIGNED, { role: "impostor" });
            } else {
              ctx.emitTo(player.socketId, IMPOSTOR_ROLE_ASSIGNED, { role: "normal", word: round.word });
            }
          }
        }

        logInfo("Impostor", `Round started in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_ADVANCE_PHASE: {
        if (ctx.room.adminPlayerId !== ctx.playerId) {
          ctx.emit("action_rejected", { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        // Support skipping to voting from discussion phases
        const wantsSkipToVoting = payload && typeof payload === "object" && "skipToVoting" in payload
          && (payload as { skipToVoting: boolean }).skipToVoting;

        let newPhase: string;
        if (wantsSkipToVoting) {
          newPhase = skipToVoting(state);
        } else {
          newPhase = advancePhase(state);
        }

        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_PHASE_CHANGED, { phase: newPhase });

        // Broadcast turn state when entering structured or free round
        if ((newPhase === "STRUCTURED_ROUND" || newPhase === "FREE_ROUND") && state.data.currentRound) {
          ctx.broadcast(IMPOSTOR_TURN_UPDATED, buildTurnUpdatePayload(state));
        }

        logInfo("Impostor", `Phase advanced to ${newPhase} in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_MARK_TURN_DONE: {
        if (ctx.room.adminPlayerId !== ctx.playerId) {
          ctx.emit("action_rejected", { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        const turnResult = markTurnDone(state);
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_TURN_UPDATED, buildTurnUpdatePayload(state));

        logInfo("Impostor", `Turn ${turnResult.currentTurnIndex} done in room ${ctx.room.code}, allDone=${turnResult.allTurnsDone}`);
        break;
      }

      case IMPOSTOR_REQUEST_VOTE: {
        // Any eligible player can request a vote
        const isEligible = eligible.some((p) => p.id === ctx.playerId);
        if (!isEligible) {
          ctx.emit("action_rejected", { code: "NOT_ELIGIBLE", message: "NOT_ELIGIBLE" });
          return;
        }

        addVoteRequest(state, ctx.playerId);
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_VOTE_REQUESTS_UPDATED, {
          playerIds: state.data.currentRound!.voteRequestPlayerIds,
        });

        logInfo("Impostor", `Vote requested by player in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_RESTART_FREE_ROUND: {
        if (ctx.room.adminPlayerId !== ctx.playerId) {
          ctx.emit("action_rejected", { code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
          return;
        }

        restartFreeRound(state);
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_PHASE_CHANGED, { phase: "FREE_ROUND", restarted: true });
        ctx.broadcast(IMPOSTOR_TURN_UPDATED, buildTurnUpdatePayload(state));

        logInfo("Impostor", `Free round restarted in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_SUBMIT_VOTE: {
        if (!payload || typeof payload !== "object" || !("targetPlayerId" in payload)) {
          ctx.emit("action_rejected", { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
          return;
        }

        const { targetPlayerId, offlinePlayerId } = payload as {
          targetPlayerId: string;
          offlinePlayerId?: string;
        };

        if (offlinePlayerId) {
          submitOfflineVote(
            state,
            eligible,
            ctx.room.adminPlayerId,
            ctx.playerId,
            offlinePlayerId,
            targetPlayerId,
            ctx.room.players,
          );
        } else {
          submitVote(state, eligible, ctx.playerId, targetPlayerId);
        }

        ctx.broadcast(IMPOSTOR_VOTE_STATE_UPDATED, {
          totalEligible: eligible.length,
          votedCount: state.data.currentRound!.votes.length,
        });

        if (checkAllVoted(state, eligible)) {
          advancePhase(state);
          const result = calculateResult(state, ctx.room.players);
          ctx.room.updatedAt = Date.now();

          ctx.broadcast(IMPOSTOR_ROUND_RESULT, result);
          ctx.broadcast(IMPOSTOR_PHASE_CHANGED, { phase: state.data.currentRound!.phase });
        }

        broadcastState(ctx, state);

        logInfo("Impostor", `Vote submitted in room ${ctx.room.code}`);
        break;
      }

      case IMPOSTOR_ADD_WORD: {
        if (!payload || typeof payload !== "object" || !("word" in payload)) {
          ctx.emit("action_rejected", { code: "INVALID_PAYLOAD", message: "INVALID_PAYLOAD" });
          return;
        }

        const { word } = payload as { word: string };
        addWord(state.data, word);
        ctx.room.updatedAt = Date.now();

        broadcastState(ctx, state);
        ctx.broadcast(IMPOSTOR_WORD_ADDED, { words: state.data.words });
        logInfo("Impostor", `Word added to room ${ctx.room.code}`);
        break;
      }

      default:
        ctx.emit("action_rejected", { code: "UNKNOWN_EVENT", message: `Unknown event: ${eventName}` });
    }
  },

  getPublicState(state: GameState): unknown {
    const s = asImpostorState(state);
    return {
      gameId: s.gameId,
      phase: s.phase,
      adminMode: s.data.adminMode,
      words: s.data.words,
      currentRound: s.data.currentRound
        ? {
            id: s.data.currentRound.id,
            phase: s.data.currentRound.phase,
            votes: s.data.currentRound.votes,
            startedAt: s.data.currentRound.startedAt,
            turnOrder: s.data.currentRound.turnOrder,
            currentTurnIndex: s.data.currentRound.currentTurnIndex,
            askedPlayerIds: s.data.currentRound.askedPlayerIds,
            voteRequestPlayerIds: s.data.currentRound.voteRequestPlayerIds,
          }
        : null,
    };
  },

  getPlayerPrivateData(state: GameState, playerId: string): unknown | null {
    const s = asImpostorState(state);
    if (!s.data.currentRound) return null;

    if (playerId === s.data.currentRound.impostorPlayerId) {
      return { role: "impostor" };
    }
    return { role: "normal", word: s.data.currentRound.word };
  },

  getEventNames(): string[] {
    return [...IMPOSTOR_CLIENT_EVENTS];
  },

  getEligibleParticipants(room: Room): Player[] {
    const state = asImpostorState(room.gameState!);
    return getEligibleParticipants(room, state);
  },

  onStop(state: GameState): void {
    const s = asImpostorState(state);
    stopRound(s);
  },
};

/** Initialize the impostor game (load words). Call at server startup. */
export function initImpostorGame(): void {
  loadImpostorWords();
}
