import { describe, it, expect } from "vitest";
import { createRoom as createRoomModel, Room } from "../../models/room.js";
import { createOnlinePlayer, createOfflinePlayer } from "../../models/player.js";
import { createRound } from "../../models/round.js";
import {
  submitVote,
  submitOfflineVote,
  checkAllVoted,
  calculateResult,
} from "../voteService.js";

function createVotingRoom(): Room {
  const room = createRoomModel("room-1", "ABCDE", "admin-1", "ADMIN_PLAYER", ["apple", "banana"]);

  const admin = createOnlinePlayer("admin-1", "Admin", "socket-admin");
  admin.isAdmin = true;
  room.players.push(admin);
  room.players.push(createOnlinePlayer("p2", "Player2", "socket-2"));
  room.players.push(createOnlinePlayer("p3", "Player3", "socket-3"));
  room.players.push(createOfflinePlayer("p4", "OfflineGuy"));

  const round = createRound("round-1", "apple", "p2");
  round.phase = "VOTING";
  room.currentRound = round;
  room.status = "VOTING";

  return room;
}

describe("voteService", () => {
  describe("submitVote", () => {
    it("V1: Submit valid vote in VOTING phase → vote recorded", () => {
      const room = createVotingRoom();
      const vote = submitVote(room, "admin-1", "p2");

      expect(vote).toBeDefined();
      expect(vote.voterPlayerId).toBe("admin-1");
      expect(vote.targetPlayerId).toBe("p2");
      expect(room.currentRound!.votes).toHaveLength(1);
      expect(room.currentRound!.votes[0]).toBe(vote);
    });

    it("V2: Submit vote outside VOTING phase → error INVALID_PHASE", () => {
      const room = createVotingRoom();
      room.currentRound!.phase = "DISCUSSION";

      expect(() => submitVote(room, "admin-1", "p2")).toThrow("INVALID_PHASE");
    });

    it("V3: Submit duplicate vote (same voter) → error ALREADY_VOTED", () => {
      const room = createVotingRoom();
      submitVote(room, "admin-1", "p2");

      expect(() => submitVote(room, "admin-1", "p3")).toThrow("ALREADY_VOTED");
    });

    it("V4: Submit vote for non-existent target → error INVALID_TARGET", () => {
      const room = createVotingRoom();

      expect(() => submitVote(room, "admin-1", "nonexistent")).toThrow("INVALID_TARGET");
    });

    it("V5: Submit vote for self → error CANNOT_VOTE_SELF", () => {
      const room = createVotingRoom();

      expect(() => submitVote(room, "admin-1", "admin-1")).toThrow("CANNOT_VOTE_SELF");
    });

    it("V6: Submit vote — voter not eligible → error NOT_ELIGIBLE", () => {
      const room = createVotingRoom();

      expect(() => submitVote(room, "nonexistent-player", "p2")).toThrow("NOT_ELIGIBLE");
    });
  });

  describe("submitOfflineVote", () => {
    it("V7: Submit offline player vote via admin → vote recorded for offline player", () => {
      const room = createVotingRoom();
      const vote = submitOfflineVote(room, "admin-1", "p4", "p2");

      expect(vote).toBeDefined();
      expect(vote.voterPlayerId).toBe("p4");
      expect(vote.targetPlayerId).toBe("p2");
      expect(room.currentRound!.votes).toHaveLength(1);
    });

    it("V8: Submit offline vote — non-admin → error UNAUTHORIZED", () => {
      const room = createVotingRoom();

      expect(() => submitOfflineVote(room, "p2", "p4", "p3")).toThrow("UNAUTHORIZED");
    });
  });

  describe("checkAllVoted", () => {
    it("V9: checkAllVoted — not all voted → returns false", () => {
      const room = createVotingRoom();
      submitVote(room, "admin-1", "p2");

      expect(checkAllVoted(room)).toBe(false);
    });

    it("V10: checkAllVoted — all voted → returns true", () => {
      const room = createVotingRoom();
      submitVote(room, "admin-1", "p2");
      submitVote(room, "p2", "p3");
      submitVote(room, "p3", "p2");
      submitVote(room, "p4", "p2");

      expect(checkAllVoted(room)).toBe(true);
    });
  });

  describe("calculateResult", () => {
    it("V11: calculateResult — impostor has most votes → impostorCaught = true", () => {
      const room = createVotingRoom();
      // p2 is the impostor
      submitVote(room, "admin-1", "p2");
      submitVote(room, "p3", "p2");
      submitVote(room, "p4", "p2");

      const result = calculateResult(room);
      expect(result.impostorCaught).toBe(true);
    });

    it("V12: calculateResult — impostor NOT most voted → impostorCaught = false", () => {
      const room = createVotingRoom();
      // p2 is the impostor, but p3 gets the most votes
      submitVote(room, "admin-1", "p3");
      submitVote(room, "p2", "p3");
      submitVote(room, "p4", "p3");

      const result = calculateResult(room);
      expect(result.impostorCaught).toBe(false);
    });

    it("V13: calculateResult — tie → impostorCaught = false", () => {
      const room = createVotingRoom();
      // p2 is the impostor — tie between p2 and p3
      submitVote(room, "admin-1", "p2");
      submitVote(room, "p3", "p2");
      submitVote(room, "p2", "p3");
      submitVote(room, "p4", "p3");

      const result = calculateResult(room);
      expect(result.impostorCaught).toBe(false);
    });

    it("V14: calculateResult — no votes → impostorCaught = false", () => {
      const room = createVotingRoom();

      const result = calculateResult(room);
      expect(result.impostorCaught).toBe(false);
    });

    it("V15: calculateResult — returns correct tally", () => {
      const room = createVotingRoom();
      submitVote(room, "admin-1", "p2");
      submitVote(room, "p3", "p2");
      submitVote(room, "p2", "p3");
      submitVote(room, "p4", "admin-1");

      const result = calculateResult(room);
      expect(result.voteTally).toEqual({
        "p2": 2,
        "p3": 1,
        "admin-1": 1,
      });
    });

    it("V16: calculateResult — reveals impostor identity and word", () => {
      const room = createVotingRoom();
      submitVote(room, "admin-1", "p2");

      const result = calculateResult(room);
      expect(result.impostorId).toBe("p2");
      expect(result.impostorName).toBe("Player2");
      expect(result.word).toBe("apple");
    });
  });
});
