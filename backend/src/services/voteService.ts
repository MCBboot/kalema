import { Room } from "../models/room.js";
import { Vote, createVote } from "../models/vote.js";
import { getEligibleParticipants } from "./roundService.js";

export function submitVote(
  room: Room,
  voterPlayerId: string,
  targetPlayerId: string,
): Vote {
  if (!room.currentRound) {
    throw new Error("NO_ACTIVE_GAME");
  }

  if (room.currentRound.phase !== "VOTING") {
    throw new Error("INVALID_PHASE");
  }

  const eligible = getEligibleParticipants(room);

  if (!eligible.find((p) => p.id === voterPlayerId)) {
    throw new Error("NOT_ELIGIBLE");
  }

  if (!eligible.find((p) => p.id === targetPlayerId)) {
    throw new Error("INVALID_TARGET");
  }

  if (voterPlayerId === targetPlayerId) {
    throw new Error("CANNOT_VOTE_SELF");
  }

  if (room.currentRound.votes.find((v) => v.voterPlayerId === voterPlayerId)) {
    throw new Error("ALREADY_VOTED");
  }

  const vote = createVote(voterPlayerId, targetPlayerId);
  room.currentRound.votes.push(vote);
  room.updatedAt = Date.now();

  return vote;
}

export function submitOfflineVote(
  room: Room,
  adminId: string,
  offlinePlayerId: string,
  targetPlayerId: string,
): Vote {
  if (room.adminPlayerId !== adminId) {
    throw new Error("UNAUTHORIZED");
  }

  const offlinePlayer = room.players.find((p) => p.id === offlinePlayerId);
  if (!offlinePlayer || offlinePlayer.type !== "OFFLINE") {
    throw new Error("PLAYER_NOT_OFFLINE");
  }

  return submitVote(room, offlinePlayerId, targetPlayerId);
}

export function checkAllVoted(room: Room): boolean {
  if (!room.currentRound) {
    return false;
  }

  const eligible = getEligibleParticipants(room);
  return room.currentRound.votes.length >= eligible.length;
}

export interface VoteResult {
  impostorId: string;
  impostorName: string;
  word: string;
  impostorCaught: boolean;
  voteTally: Record<string, number>;
}

export function calculateResult(room: Room): VoteResult {
  if (!room.currentRound) {
    throw new Error("NO_ACTIVE_GAME");
  }

  const round = room.currentRound;
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

  const impostorPlayer = room.players.find((p) => p.id === round.impostorPlayerId);
  const impostorName = impostorPlayer ? impostorPlayer.displayName : "Unknown";

  return {
    impostorId: round.impostorPlayerId,
    impostorName,
    word: round.word,
    impostorCaught,
    voteTally,
  };
}
