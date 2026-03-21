import { Vote } from "./vote.js";

export interface Round {
  id: string;
  word: string;
  impostorPlayerId: string;
  phase: "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";
  votes: Vote[];
  startedAt: number;
}

export function createRound(
  id: string,
  word: string,
  impostorPlayerId: string,
): Round {
  return {
    id,
    word,
    impostorPlayerId,
    phase: "ROLE_REVEAL",
    votes: [],
    startedAt: Date.now(),
  };
}
