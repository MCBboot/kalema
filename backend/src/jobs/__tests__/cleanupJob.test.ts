import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startCleanupJob, stopCleanupJob } from "../cleanupJob.js";
import {
  getAllRooms,
  getAllReconnectTokens,
  setRoom,
  setReconnectToken,
} from "../../store/memoryStore.js";
import { createRoom as createRoomModel } from "../../models/room.js";
import { createOnlinePlayer } from "../../models/player.js";
import {
  CLEANUP_INTERVAL_MS,
  ROOM_INACTIVITY_TIMEOUT_MS,
  RECONNECT_TOKEN_EXPIRY_MS,
} from "../../config/constants.js";

function clearStores(): void {
  getAllRooms().clear();
  getAllReconnectTokens().clear();
}

describe("cleanupJob", () => {
  beforeEach(() => {
    clearStores();
    vi.useFakeTimers({ now: 100_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("CL1: cleanup removes expired reconnect tokens", () => {
    const expiredTime = Date.now() - 1;

    setReconnectToken({
      token: "expired-1",
      roomId: "room-1",
      playerId: "player-1",
      expiresAt: expiredTime,
    });

    setReconnectToken({
      token: "valid-1",
      roomId: "room-1",
      playerId: "player-2",
      expiresAt: Date.now() + RECONNECT_TOKEN_EXPIRY_MS,
    });

    const handle = startCleanupJob();

    vi.advanceTimersByTime(CLEANUP_INTERVAL_MS);

    expect(getAllReconnectTokens().has("expired-1")).toBe(false);
    expect(getAllReconnectTokens().has("valid-1")).toBe(true);

    stopCleanupJob(handle);
  });

  it("CL2: cleanup removes inactive empty rooms (no connected players + timeout exceeded)", () => {
    const oldTime = Date.now() - ROOM_INACTIVITY_TIMEOUT_MS - 1;

    const room = createRoomModel("room-1", "ABCDE", "player-1");
    room.updatedAt = oldTime;
    // Add a disconnected player (no connected online players)
    const player = createOnlinePlayer("player-1", "Alice", "socket-1");
    player.isConnected = false;
    player.socketId = null;
    room.players.push(player);
    setRoom(room);

    const handle = startCleanupJob();

    vi.advanceTimersByTime(CLEANUP_INTERVAL_MS);

    expect(getAllRooms().has("room-1")).toBe(false);

    stopCleanupJob(handle);
  });

  it("CL3: cleanup keeps active rooms (has connected players)", () => {
    const oldTime = Date.now() - ROOM_INACTIVITY_TIMEOUT_MS - 1;

    const room = createRoomModel("room-2", "BCDEG", "player-1");
    room.updatedAt = oldTime;
    // Add a connected player
    const player = createOnlinePlayer("player-1", "Alice", "socket-1");
    player.isConnected = true;
    room.players.push(player);
    setRoom(room);

    const handle = startCleanupJob();

    vi.advanceTimersByTime(CLEANUP_INTERVAL_MS);

    expect(getAllRooms().has("room-2")).toBe(true);

    stopCleanupJob(handle);
  });

  it("CL4: cleanup keeps recently active empty rooms (within timeout window)", () => {
    const room = createRoomModel("room-3", "CDEFG", "player-1");
    room.updatedAt = Date.now(); // recently updated
    // No connected players
    const player = createOnlinePlayer("player-1", "Alice", "socket-1");
    player.isConnected = false;
    player.socketId = null;
    room.players.push(player);
    setRoom(room);

    const handle = startCleanupJob();

    vi.advanceTimersByTime(CLEANUP_INTERVAL_MS);

    expect(getAllRooms().has("room-3")).toBe(true);

    stopCleanupJob(handle);
  });
});
