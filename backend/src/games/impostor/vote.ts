import { Player } from "../../models/player.js";
import { ImpostorGameState, Vote, createVote } from "./state.js";

export function submitVote(
  state: ImpostorGameState,
  eligible: Player[],
  voterPlayerId: string,
  targetPlayerId: string,
): Vote {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (round.phase !== "VOTING") {
    throw new Error("INVALID_PHASE");
  }

  if (!eligible.find((p) => p.id === voterPlayerId)) {
    throw new Error("NOT_ELIGIBLE");
  }

  if (!eligible.find((p) => p.id === targetPlayerId)) {
    throw new Error("INVALID_TARGET");
  }

  if (voterPlayerId === targetPlayerId) {
    throw new Error("CANNOT_VOTE_SELF");
  }

  if (round.votes.find((v) => v.voterPlayerId === voterPlayerId)) {
    throw new Error("ALREADY_VOTED");
  }

  const vote = createVote(voterPlayerId, targetPlayerId);
  round.votes.push(vote);

  return vote;
}

export function submitOfflineVote(
  state: ImpostorGameState,
  eligible: Player[],
  adminId: string,
  adminPlayerId: string,
  offlinePlayerId: string,
  targetPlayerId: string,
  players: Player[],
): Vote {
  if (adminPlayerId !== adminId) {
    throw new Error("UNAUTHORIZED");
  }

  const offlinePlayer = players.find((p) => p.id === offlinePlayerId);
  if (!offlinePlayer || offlinePlayer.type !== "OFFLINE") {
    throw new Error("PLAYER_NOT_OFFLINE");
  }

  return submitVote(state, eligible, offlinePlayerId, targetPlayerId);
}

export function checkAllVoted(state: ImpostorGameState, eligible: Player[]): boolean {
  const round = state.data.currentRound;
  if (!round) {
    return false;
  }
  return round.votes.length >= eligible.length;
}

export interface VoteResult {
  impostorId: string;
  impostorName: string;
  word: string;
  impostorCaught: boolean;
  voteTally: Record<string, number>;
}

export function calculateResult(
  state: ImpostorGameState,
  players: Player[],
): VoteResult {
  const round = state.data.currentRound;
  if (!round) {
    throw new Error("NO_ACTIVE_GAME");
  }

  const votes = round.votes;

  // Build vote tally
  const voteTally: Record<string, number> = {};
  for (const vote of votes) {
    voteTally[vote.targetPlayerId] = (voteTally[vote.targetPlayerId] || 0) + 1;
  }

  // Find player with most votes
  let maxVotes = 0;
  let maxTargetId: string | null = null;
  let isTie = false;

  for (const [targetId, count] of Object.entries(voteTally)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxTargetId = targetId;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  let impostorCaught = false;
  if (votes.length > 0 && !isTie && maxTargetId === round.impostorPlayerId) {
    impostorCaught = true;
  }

  const impostorPlayer = players.find((p) => p.id === round.impostorPlayerId);
  const impostorName = impostorPlayer ? impostorPlayer.displayName : "Unknown";

  return {
    impostorId: round.impostorPlayerId,
    impostorName,
    word: round.word,
    impostorCaught,
    voteTally,
  };
}
