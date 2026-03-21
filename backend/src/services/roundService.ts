import { Room } from "../models/room.js";
import { Player } from "../models/player.js";
import { Round, createRound } from "../models/round.js";
import { pickRandom } from "../utils/random.js";
import { generateId } from "../utils/id.js";
import { MIN_PLAYERS_TO_START } from "../config/constants.js";

export function getEligibleParticipants(room: Room): Player[] {
  return room.players.filter((p) => {
    // Offline players are always eligible
    if (p.type === "OFFLINE") {
      return true;
    }

    // Online players must be connected
    if (!p.isConnected) {
      return false;
    }

    // In ADMIN_ONLY mode, exclude the admin
    if (room.adminMode === "ADMIN_ONLY" && p.id === room.adminPlayerId) {
      return false;
    }

    return true;
  });
}

export function startRound(room: Room): Round {
  if (room.status !== "WAITING") {
    throw new Error("INVALID_PHASE");
  }

  const eligible = getEligibleParticipants(room);

  if (eligible.length < MIN_PLAYERS_TO_START) {
    throw new Error("INSUFFICIENT_PLAYERS");
  }

  if (room.words.length === 0) {
    throw new Error("NO_WORDS");
  }

  const word = pickRandom(room.words);
  const impostor = pickRandom(eligible);

  const round = createRound(generateId(), word, impostor.id);

  room.status = "ROLE_REVEAL";
  room.currentRound = round;
  room.updatedAt = Date.now();

  return round;
}

export function advancePhase(room: Room): string {
  if (!room.currentRound) {
    throw new Error("NO_ACTIVE_GAME");
  }

  const currentPhase = room.currentRound.phase;

  switch (currentPhase) {
    case "ROLE_REVEAL":
      room.currentRound.phase = "DISCUSSION";
      room.status = "DISCUSSION";
      break;
    case "DISCUSSION":
      room.currentRound.phase = "VOTING";
      room.status = "VOTING";
      break;
    case "VOTING":
      room.currentRound.phase = "RESULT";
      room.status = "RESULT";
      break;
    case "RESULT":
      room.currentRound = null;
      room.status = "WAITING";
      room.updatedAt = Date.now();
      return "WAITING";
    default:
      throw new Error("INVALID_PHASE_TRANSITION");
  }

  room.updatedAt = Date.now();
  return room.status;
}

export function stopGame(room: Room): void {
  if (!room.currentRound) {
    throw new Error("NO_ACTIVE_GAME");
  }

  room.currentRound = null;
  room.status = "WAITING";
  room.updatedAt = Date.now();
}
