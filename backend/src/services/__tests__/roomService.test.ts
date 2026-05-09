import { describe, it, expect, beforeEach } from "vitest";
import {
  createRoom,
  joinRoom,
  leaveRoom,
} from "../roomService.js";
import {
  getAllRooms,
  getSessionBySocket,
} from "../../store/memoryStore.js";
import { registerGame } from "@kalema/shared";
import { impostorGame, initImpostorGame } from "@kalema/shared";

// Register impostor game for tests that need it
try {
  initImpostorGame();
  registerGame(impostorGame);
} catch {
  // Already registered
}

function clearStore(): void {
  const rooms = getAllRooms();
  rooms.clear();
}

describe("roomService", () => {
  beforeEach(() => {
    clearStore();
  });

  it("R1: createRoom creates room with correct data, creator is admin, status WAITING", () => {
    const { room, player } = createRoom("Alice", "socket-1");

    expect(room.status).toBe("WAITING");
    expect(room.adminPlayerId).toBe(player.id);
    expect(player.isAdmin).toBe(true);
    expect(player.displayName).toBe("Alice");
    expect(room.players).toHaveLength(1);
    expect(room.selectedGame).toBeNull();
    expect(room.gameState).toBeNull();
  });

  it("R4: joinRoom adds player, list grows", () => {
    const { room } = createRoom("Alice", "socket-1");
    const { room: updatedRoom, player: newPlayer } = joinRoom(room.code, "Bob", "socket-2");

    expect(updatedRoom.players).toHaveLength(2);
    expect(newPlayer.displayName).toBe("Bob");
    expect(newPlayer.isAdmin).toBe(false);
  });

  it("R5: joinRoom with non-existent code throws error", () => {
    expect(() => joinRoom("ZZZZZ", "Bob", "socket-2")).toThrow("ROOM_NOT_FOUND");
  });

  it("R6: joinRoom with duplicate name throws error", () => {
    const { room } = createRoom("Alice", "socket-1");
    expect(() => joinRoom(room.code, "Alice", "socket-2")).toThrow("DUPLICATE_NAME");
  });

  it("R7: leaveRoom non-admin removes player", () => {
    const { room } = createRoom("Alice", "socket-1");
    joinRoom(room.code, "Bob", "socket-2");

    const result = leaveRoom("socket-2");
    expect(result).not.toBeNull();
    expect(result!.player.displayName).toBe("Bob");
    expect(result!.wasAdmin).toBe(false);
    expect(result!.room).not.toBeNull();
    expect(result!.room!.players).toHaveLength(1);
  });

  it("R8: leaveRoom admin auto-transfers admin", () => {
    const { room } = createRoom("Alice", "socket-1");
    joinRoom(room.code, "Bob", "socket-2");

    const result = leaveRoom("socket-1");
    expect(result).not.toBeNull();
    expect(result!.wasAdmin).toBe(true);
    expect(result!.room).not.toBeNull();
    const remainingPlayers = result!.room!.players;
    expect(remainingPlayers).toHaveLength(1);
    expect(remainingPlayers[0].isAdmin).toBe(true);
    expect(remainingPlayers[0].displayName).toBe("Bob");
  });

  it("R9: leaveRoom last player deletes room", () => {
    const { room } = createRoom("Alice", "socket-1");
    const roomId = room.id;

    const result = leaveRoom("socket-1");
    expect(result).not.toBeNull();
    expect(result!.room).toBeNull();
    expect(getAllRooms().has(roomId)).toBe(false);
  });
});
