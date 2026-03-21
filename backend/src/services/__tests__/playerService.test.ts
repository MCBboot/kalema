import { describe, it, expect, beforeEach } from "vitest";
import { Room, createRoom as createRoomModel } from "../../models/room.js";
import {
  addOnlinePlayer,
  addOfflinePlayer,
  removePlayer,
  findPlayerBySocketId,
  findPlayerById,
  markDisconnected,
  markReconnected,
  getDisplayNames,
} from "../playerService.js";

function makeRoom(): Room {
  return createRoomModel("room-1", "ABCDE", "admin-1", "ADMIN_PLAYER", ["word1", "word2"]);
}

describe("playerService", () => {
  let room: Room;

  beforeEach(() => {
    room = makeRoom();
  });

  it("P1: addOnlinePlayer adds player to room", () => {
    const player = addOnlinePlayer(room, "Alice", "socket-1");
    expect(player.displayName).toBe("Alice");
    expect(player.type).toBe("ONLINE");
    expect(player.isConnected).toBe(true);
    expect(player.socketId).toBe("socket-1");
    expect(room.players).toHaveLength(1);
  });

  it("P2: addOnlinePlayer generates unique IDs", () => {
    const p1 = addOnlinePlayer(room, "Alice", "socket-1");
    const p2 = addOnlinePlayer(room, "Bob", "socket-2");
    expect(p1.id).not.toBe(p2.id);
  });

  it("P3: addOfflinePlayer adds offline player", () => {
    const player = addOfflinePlayer(room, "Offline Bob");
    expect(player.type).toBe("OFFLINE");
    expect(player.isConnected).toBe(false);
    expect(player.socketId).toBeNull();
  });

  it("P4: multiple players added to room", () => {
    addOnlinePlayer(room, "Alice", "socket-1");
    addOnlinePlayer(room, "Bob", "socket-2");
    addOfflinePlayer(room, "Charlie");
    expect(room.players).toHaveLength(3);
  });

  it("P5: getDisplayNames returns all names", () => {
    addOnlinePlayer(room, "Alice", "socket-1");
    addOnlinePlayer(room, "Bob", "socket-2");
    expect(getDisplayNames(room)).toEqual(["Alice", "Bob"]);
  });

  it("P6: removePlayer removes and returns player", () => {
    const player = addOnlinePlayer(room, "Alice", "socket-1");
    const removed = removePlayer(room, player.id);
    expect(removed).not.toBeNull();
    expect(removed!.displayName).toBe("Alice");
    expect(room.players).toHaveLength(0);
  });

  it("P7: removePlayer returns null for non-existent player", () => {
    const removed = removePlayer(room, "non-existent-id");
    expect(removed).toBeNull();
  });

  it("P8: markDisconnected sets isConnected false and socketId null", () => {
    const player = addOnlinePlayer(room, "Alice", "socket-1");
    markDisconnected(room, player.id);
    expect(player.isConnected).toBe(false);
    expect(player.socketId).toBeNull();
  });

  it("P9: markReconnected sets isConnected true and new socketId", () => {
    const player = addOnlinePlayer(room, "Alice", "socket-1");
    markDisconnected(room, player.id);
    markReconnected(room, player.id, "socket-2");
    expect(player.isConnected).toBe(true);
    expect(player.socketId).toBe("socket-2");
  });

  it("P10: findPlayerBySocketId finds correct player", () => {
    addOnlinePlayer(room, "Alice", "socket-1");
    addOnlinePlayer(room, "Bob", "socket-2");
    const found = findPlayerBySocketId(room, "socket-2");
    expect(found).toBeDefined();
    expect(found!.displayName).toBe("Bob");
  });

  it("P11: findPlayerBySocketId returns undefined for non-existent socketId", () => {
    addOnlinePlayer(room, "Alice", "socket-1");
    const found = findPlayerBySocketId(room, "socket-999");
    expect(found).toBeUndefined();
  });
});
