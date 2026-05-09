import { Player } from "../../models/player.js";
import { pickRandom } from "../../utils/random.js";
import { generateId } from "../../utils/id.js";
import { ImpostorGameState, ImpostorRound, ImpostorPhase } from "./state.js";

const MIN_PLAYERS_TO_START = 3;

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function startRound(
  state: ImpostorGameState,
  eligible: Player[],
  selectedWord?: string,
): ImpostorRound {
  if (state.phase !== "CHOOSING") {
    throw new Error("INVALID_PHASE");
  }

  if (eligible.length < MIN_PLAYERS_TO_START) {
    throw new Error("INSUFFICIENT_PLAYERS");
  }

  if (state.data.words.length === 0) {
    throw new Error("NO_WORDS");
  }

  const word = selectedWord?.trim() || pickRandom(state.data.words);
  const impostor = pickRandom(eligible);

  const round: ImpostorRound = {
    id: generateId(),
    word,
    impostorPlayerId: impostor.id,
    phase: "ROLE_REVEAL",
    votes: [],
    startedAt: Date.now(),
    turnOrder: shuffleArray(eligible.map((p) => p.id)),
    currentTurnIndex: 0,
    askedPlayerIds: [],
    voteRequestPlayerIds: [],
  };

  state.phase = "ROLE_REVEAL";
  state.data.currentRound = round;

  return round;
}

export function advancePhase(state: ImpostorGameState): ImpostorPhase {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  const transitions: Record<string, ImpostorPhase> = {
    ROLE_REVEAL: "STRUCTURED_ROUND",
    STRUCTURED_ROUND: "FREE_ROUND",
    FREE_ROUND: "VOTING",
    VOTING: "RESULT",
  };

  if (round.phase === "RESULT") {
    state.data.currentRound = null;
    state.phase = "CHOOSING";
    return "CHOOSING";
  }

  const nextPhase = transitions[round.phase];

  if (!nextPhase) {
    throw new Error("INVALID_PHASE_TRANSITION");
  }

  // Clear vote requests when entering VOTING
  if (nextPhase === "VOTING") {
    round.voteRequestPlayerIds = [];
  }

  // Reset turn tracking when entering FREE_ROUND
  if (nextPhase === "FREE_ROUND") {
    round.currentTurnIndex = 0;
    round.askedPlayerIds = [];
  }

  round.phase = nextPhase;
  state.phase = nextPhase;

  return nextPhase;
}

export function skipToVoting(state: ImpostorGameState): ImpostorPhase {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (round.phase !== "STRUCTURED_ROUND" && round.phase !== "FREE_ROUND") {
    throw new Error("INVALID_PHASE_TRANSITION");
  }

  round.voteRequestPlayerIds = [];
  round.phase = "VOTING";
  state.phase = "VOTING";

  return "VOTING";
}

export interface MarkTurnResult {
  allTurnsDone: boolean;
  currentTurnIndex: number;
}

export function markTurnDone(state: ImpostorGameState): MarkTurnResult {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (round.phase !== "STRUCTURED_ROUND" && round.phase !== "FREE_ROUND") {
    throw new Error("INVALID_PHASE");
  }

  if (round.currentTurnIndex >= round.turnOrder.length) {
    throw new Error("ALL_TURNS_DONE");
  }

  const currentPlayerId = round.turnOrder[round.currentTurnIndex];
  if (!round.askedPlayerIds.includes(currentPlayerId)) {
    round.askedPlayerIds.push(currentPlayerId);
  }

  round.currentTurnIndex++;

  return {
    allTurnsDone: round.currentTurnIndex >= round.turnOrder.length,
    currentTurnIndex: round.currentTurnIndex,
  };
}

export function addVoteRequest(state: ImpostorGameState, playerId: string): void {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (round.phase !== "STRUCTURED_ROUND" && round.phase !== "FREE_ROUND") {
    throw new Error("INVALID_PHASE");
  }

  if (!round.voteRequestPlayerIds.includes(playerId)) {
    round.voteRequestPlayerIds.push(playerId);
  }
}

export function restartFreeRound(state: ImpostorGameState): void {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (round.phase !== "FREE_ROUND") {
    throw new Error("INVALID_PHASE");
  }

  // Reset turns back to start
  round.currentTurnIndex = 0;
  round.askedPlayerIds = [];
  // Vote requests persist across free round repeats (by design)
}

export function stopRound(state: ImpostorGameState): void {
  state.data.currentRound = null;
  state.phase = "CHOOSING";
}
