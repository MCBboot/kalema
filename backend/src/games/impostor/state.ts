import { GameState } from "../types.js";

export type ImpostorPhase = "CHOOSING" | "ROLE_REVEAL" | "STRUCTURED_ROUND" | "FREE_ROUND" | "VOTING" | "RESULT";

export type AdminMode = "ADMIN_ONLY" | "ADMIN_PLAYER";

export interface Vote {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: number;
}

export interface ImpostorRound {
  id: string;
  word: string;
  impostorPlayerId: string;
  phase: ImpostorPhase;
  votes: Vote[];
  startedAt: number;
  turnOrder: string[];
  currentTurnIndex: number;
  askedPlayerIds: string[];
  voteRequestPlayerIds: string[];
}

export interface ImpostorData {
  adminMode: AdminMode;
  words: string[];
  currentRound: ImpostorRound | null;
}

export interface ImpostorGameState extends GameState {
  gameId: "impostor";
  phase: ImpostorPhase;
  data: ImpostorData;
}

export function createVote(voterPlayerId: string, targetPlayerId: string): Vote {
  return {
    voterPlayerId,
    targetPlayerId,
    submittedAt: Date.now(),
  };
}
