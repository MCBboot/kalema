import { describe, it, expect, beforeEach } from "vitest";
import { Room, createRoom as createRoomModel } from "../../models/room.js";
import { createOnlinePlayer, createOfflinePlayer } from "../../models/player.js";
import {
  transferAdmin,
  kickPlayer,
  addOfflinePlayer,
  removeOfflinePlayer,
} from "../adminService.js";

function makeRoom(): Room {
  const room = createRoomModel("room-1", "ABCDE", "admin-1", "ADMIN_PLAYER", ["word1", "word2"]);
  const admin = createOnlinePlayer("admin-1", "Alice", "socket-1");
  admin.isAdmin = true;
  room.players.push(admin);
  return room;
}

describe("adminService", () => {
  let room: Room;

  beforeEach(() => {
    room = makeRoom();
  });

  describe("transferAdmin", () => {
    it("A1: transfers admin to valid target", () => {
      const target = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(target);

      transferAdmin(room, "admin-1", "player-2");

      expect(target.isAdmin).toBe(true);
      expect(room.adminPlayerId).toBe("player-2");
      const oldAdmin = room.players.find((p) => p.id === "admin-1");
      expect(oldAdmin!.isAdmin).toBe(false);
    });

    it("A2: non-admin attempts transfer → UNAUTHORIZED", () => {
      const target = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(target);

      expect(() => transferAdmin(room, "player-2", "admin-1")).toThrow("UNAUTHORIZED");
    });

    it("A3: transfer to non-existent player → PLAYER_NOT_FOUND", () => {
      expect(() => transferAdmin(room, "admin-1", "non-existent")).toThrow("PLAYER_NOT_FOUND");
    });

    it("A4: transfer admin to self → INVALID_TARGET", () => {
      expect(() => transferAdmin(room, "admin-1", "admin-1")).toThrow("INVALID_TARGET");
    });
  });

  describe("kickPlayer", () => {
    it("A5: kick online player → player removed from room", () => {
      const target = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(target);

      const kicked = kickPlayer(room, "admin-1", "player-2");

      expect(kicked.displayName).toBe("Bob");
      expect(room.players).toHaveLength(1);
      expect(room.players.find((p) => p.id === "player-2")).toBeUndefined();
    });

    it("A6: kick offline player → player removed", () => {
      const target = createOfflinePlayer("player-2", "OfflineBob");
      room.players.push(target);

      const kicked = kickPlayer(room, "admin-1", "player-2");

      expect(kicked.displayName).toBe("OfflineBob");
      expect(room.players).toHaveLength(1);
    });

    it("A7: non-admin attempts kick → UNAUTHORIZED", () => {
      const target = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(target);

      expect(() => kickPlayer(room, "player-2", "admin-1")).toThrow("UNAUTHORIZED");
    });

    it("A8: kick admin (self) → CANNOT_KICK_ADMIN", () => {
      expect(() => kickPlayer(room, "admin-1", "admin-1")).toThrow("CANNOT_KICK_ADMIN");
    });

    it("A9: kick non-existent player → PLAYER_NOT_FOUND", () => {
      expect(() => kickPlayer(room, "admin-1", "non-existent")).toThrow("PLAYER_NOT_FOUND");
    });
  });

  describe("addOfflinePlayer", () => {
    it("A10: add offline player with valid unique name → player added, type OFFLINE", () => {
      const player = addOfflinePlayer(room, "admin-1", "OfflineCharlie");

      expect(player.type).toBe("OFFLINE");
      expect(player.displayName).toBe("OfflineCharlie");
      expect(player.isConnected).toBe(false);
      expect(room.players).toHaveLength(2);
    });

    it("A11: add offline player with duplicate name → DUPLICATE_NAME", () => {
      expect(() => addOfflinePlayer(room, "admin-1", "Alice")).toThrow("DUPLICATE_NAME");
    });

    it("A12: non-admin attempts add → UNAUTHORIZED", () => {
      const target = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(target);

      expect(() => addOfflinePlayer(room, "player-2", "Charlie")).toThrow("UNAUTHORIZED");
    });
  });

  describe("removeOfflinePlayer", () => {
    it("A13: remove offline player → player removed", () => {
      const offline = createOfflinePlayer("player-2", "OfflineBob");
      room.players.push(offline);

      const removed = removeOfflinePlayer(room, "admin-1", "player-2");

      expect(removed.displayName).toBe("OfflineBob");
      expect(room.players).toHaveLength(1);
    });

    it("A14: remove online player via removeOfflinePlayer → PLAYER_NOT_OFFLINE", () => {
      const online = createOnlinePlayer("player-2", "Bob", "socket-2");
      room.players.push(online);

      expect(() => removeOfflinePlayer(room, "admin-1", "player-2")).toThrow("PLAYER_NOT_OFFLINE");
    });
  });
});
