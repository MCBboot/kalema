import { describe, it, expect, beforeEach } from "vitest";
import { createRoom as createRoomModel, Room } from "../../models/room.js";
import { createOnlinePlayer, createOfflinePlayer } from "../../models/player.js";
import { createRound } from "../../models/round.js";
import {
  getEligibleParticipants,
  startRound,
  advancePhase,
  stopGame,
} from "../roundService.js";

function makeRoom(overrides?: Partial<Room>): Room {
  const room = createRoomModel("room-1", "ABCDE", "admin-1", "ADMIN_PLAYER", ["apple", "banana"]);
  // Add admin player
  const admin = createOnlinePlayer("admin-1", "Admin", "socket-admin");
  admin.isAdmin = true;
  room.players.push(admin);
  // Add two more online players to meet MIN_PLAYERS_TO_START
  room.players.push(createOnlinePlayer("p2", "Player2", "socket-2"));
  room.players.push(createOnlinePlayer("p3", "Player3", "socket-3"));
  if (overrides) {
    Object.assign(room, overrides);
  }
  return room;
}

describe("roundService", () => {
  describe("startRound", () => {
    it("G1: valid conditions → round created, impostor selected, word selected, status ROLE_REVEAL", () => {
      const room = makeRoom();
      const round = startRound(room);

      expect(round).toBeDefined();
      expect(round.impostorPlayerId).toBeTruthy();
      expect(round.word).toBeTruthy();
      expect(room.status).toBe("ROLE_REVEAL");
      expect(room.currentRound).toBe(round);
    });

    it("G2: room not WAITING → error INVALID_PHASE", () => {
      const room = makeRoom({ status: "DISCUSSION" });
      expect(() => startRound(room)).toThrow("INVALID_PHASE");
    });

    it("G3: fewer than min players → error INSUFFICIENT_PLAYERS", () => {
      const room = makeRoom();
      // Remove players to have fewer than 3
      room.players = [room.players[0]];
      expect(() => startRound(room)).toThrow("INSUFFICIENT_PLAYERS");
    });

    it("G4: zero words → error NO_WORDS", () => {
      const room = makeRoom({ words: [] });
      expect(() => startRound(room)).toThrow("NO_WORDS");
    });

    it("G5: ADMIN_ONLY → admin excluded from eligible", () => {
      const room = makeRoom({ adminMode: "ADMIN_ONLY" });
      const eligible = getEligibleParticipants(room);
      expect(eligible.find((p) => p.id === "admin-1")).toBeUndefined();
    });

    it("G6: ADMIN_PLAYER → admin included in eligible", () => {
      const room = makeRoom({ adminMode: "ADMIN_PLAYER" });
      const eligible = getEligibleParticipants(room);
      expect(eligible.find((p) => p.id === "admin-1")).toBeDefined();
    });

    it("G7: offline players included in eligible", () => {
      const room = makeRoom();
      const offlinePlayer = createOfflinePlayer("offline-1", "OfflineGuy");
      room.players.push(offlinePlayer);
      const eligible = getEligibleParticipants(room);
      expect(eligible.find((p) => p.id === "offline-1")).toBeDefined();
    });

    it("G8: exactly one impostor selected", () => {
      const room = makeRoom();
      const round = startRound(room);
      const impostors = room.players.filter((p) => p.id === round.impostorPlayerId);
      expect(impostors).toHaveLength(1);
    });

    it("G9: round word is from room.words", () => {
      const room = makeRoom();
      const round = startRound(room);
      expect(["apple", "banana"]).toContain(round.word);
    });
  });

  describe("advancePhase", () => {
    it("G10: ROLE_REVEAL → DISCUSSION", () => {
      const room = makeRoom();
      startRound(room);
      const newPhase = advancePhase(room);
      expect(newPhase).toBe("DISCUSSION");
      expect(room.currentRound!.phase).toBe("DISCUSSION");
      expect(room.status).toBe("DISCUSSION");
    });

    it("G11: DISCUSSION → VOTING", () => {
      const room = makeRoom();
      startRound(room);
      advancePhase(room); // → DISCUSSION
      const newPhase = advancePhase(room);
      expect(newPhase).toBe("VOTING");
      expect(room.currentRound!.phase).toBe("VOTING");
      expect(room.status).toBe("VOTING");
    });

    it("G12: VOTING → RESULT", () => {
      const room = makeRoom();
      startRound(room);
      advancePhase(room); // → DISCUSSION
      advancePhase(room); // → VOTING
      const newPhase = advancePhase(room);
      expect(newPhase).toBe("RESULT");
      expect(room.currentRound!.phase).toBe("RESULT");
      expect(room.status).toBe("RESULT");
    });

    it("G13: RESULT → WAITING (round cleared)", () => {
      const room = makeRoom();
      startRound(room);
      advancePhase(room); // → DISCUSSION
      advancePhase(room); // → VOTING
      advancePhase(room); // → RESULT
      const newPhase = advancePhase(room);
      expect(newPhase).toBe("WAITING");
      expect(room.currentRound).toBeNull();
      expect(room.status).toBe("WAITING");
    });

    it("G14: no active round → error NO_ACTIVE_GAME", () => {
      const room = makeRoom();
      expect(() => advancePhase(room)).toThrow("NO_ACTIVE_GAME");
    });
  });

  describe("stopGame", () => {
    it("G15: stop from active phase → status WAITING, round null", () => {
      const room = makeRoom();
      startRound(room);
      advancePhase(room); // → DISCUSSION
      stopGame(room);
      expect(room.status).toBe("WAITING");
      expect(room.currentRound).toBeNull();
    });

    it("G16: stop from WAITING (no round) → error NO_ACTIVE_GAME", () => {
      const room = makeRoom();
      expect(() => stopGame(room)).toThrow("NO_ACTIVE_GAME");
    });
  });

  describe("getEligibleParticipants", () => {
    it("G17: excludes disconnected online players", () => {
      const room = makeRoom();
      // Disconnect Player2
      const p2 = room.players.find((p) => p.id === "p2")!;
      p2.isConnected = false;
      const eligible = getEligibleParticipants(room);
      expect(eligible.find((p) => p.id === "p2")).toBeUndefined();
      // Others still included
      expect(eligible.find((p) => p.id === "admin-1")).toBeDefined();
      expect(eligible.find((p) => p.id === "p3")).toBeDefined();
    });
  });
});
