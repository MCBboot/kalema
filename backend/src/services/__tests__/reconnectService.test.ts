import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  createSession,
  recoverSession,
  cleanExpiredTokens,
} from "../reconnectService.js";
import {
  getAllRooms,
  getAllReconnectTokens,
  setRoom,
  setSession,
  getSessionBySocket,
} from "../../store/memoryStore.js";
import { createRoom as createRoomModel } from "../../models/room.js";
import { createOnlinePlayer } from "../../models/player.js";
import { RECONNECT_TOKEN_EXPIRY_MS } from "../../config/constants.js";

function clearStores(): void {
  getAllRooms().clear();
  getAllReconnectTokens().clear();
}

describe("reconnectService", () => {
  beforeEach(() => {
    clearStores();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("RC1: createSession generates token, stores in map with correct expiry", () => {
    const now = Date.now();
    vi.useFakeTimers({ now });

    const token = createSession("room-1", "player-1");

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    const tokens = getAllReconnectTokens();
    expect(tokens.has(token)).toBe(true);

    const session = tokens.get(token)!;
    expect(session.roomId).toBe("room-1");
    expect(session.playerId).toBe("player-1");
    expect(session.expiresAt).toBe(now + RECONNECT_TOKEN_EXPIRY_MS);
  });

  it("RC2: recoverSession with valid token rebinds player and returns room/player", () => {
    const room = createRoomModel("room-1", "ABCDE", "player-1");
    const player = createOnlinePlayer("player-1", "Alice", "old-socket");
    player.isAdmin = true;
    player.isConnected = false;
    player.socketId = null;
    room.players.push(player);
    setRoom(room);

    const token = createSession("room-1", "player-1");

    const result = recoverSession(token, "new-socket");

    expect(result).not.toBeNull();
    expect(result!.room.id).toBe("room-1");
    expect(result!.player.id).toBe("player-1");
    expect(result!.player.isConnected).toBe(true);
    expect(result!.player.socketId).toBe("new-socket");
    expect(typeof result!.newToken).toBe("string");
    expect(result!.newToken).not.toBe(token);

    // Old token should be deleted
    expect(getAllReconnectTokens().has(token)).toBe(false);

    // New token should exist
    expect(getAllReconnectTokens().has(result!.newToken)).toBe(true);

    // Socket session should be set
    const socketSession = getSessionBySocket("new-socket");
    expect(socketSession).toBeDefined();
    expect(socketSession!.roomId).toBe("room-1");
    expect(socketSession!.playerId).toBe("player-1");
  });

  it("RC3: recoverSession with expired token returns null", () => {
    vi.useFakeTimers({ now: 1000 });

    const room = createRoomModel("room-1", "ABCDE", "player-1");
    const player = createOnlinePlayer("player-1", "Alice", "old-socket");
    player.isConnected = false;
    player.socketId = null;
    room.players.push(player);
    setRoom(room);

    const token = createSession("room-1", "player-1");

    // Advance past expiry
    vi.advanceTimersByTime(RECONNECT_TOKEN_EXPIRY_MS + 1);

    const result = recoverSession(token, "new-socket");
    expect(result).toBeNull();

    // Token should be deleted
    expect(getAllReconnectTokens().has(token)).toBe(false);
  });

  it("RC4: recoverSession with invalid/non-existent token returns null", () => {
    const result = recoverSession("non-existent-token", "new-socket");
    expect(result).toBeNull();
  });

  it("RC5: recoverSession when room no longer exists returns null", () => {
    // Create token but don't store room
    const token = createSession("room-gone", "player-1");

    const result = recoverSession(token, "new-socket");
    expect(result).toBeNull();
    expect(getAllReconnectTokens().has(token)).toBe(false);
  });

  it("RC6: recoverSession when player no longer in room returns null", () => {
    const room = createRoomModel("room-1", "ABCDE", "player-1");
    // Room exists but player-2 is not in it
    const player = createOnlinePlayer("player-1", "Alice", "socket-1");
    room.players.push(player);
    setRoom(room);

    const token = createSession("room-1", "player-999");

    const result = recoverSession(token, "new-socket");
    expect(result).toBeNull();
    expect(getAllReconnectTokens().has(token)).toBe(false);
  });

  it("RC7: cleanExpiredTokens removes expired, keeps valid", () => {
    vi.useFakeTimers({ now: 1000 });

    createSession("room-1", "player-1"); // will expire
    createSession("room-1", "player-2"); // will expire

    // Advance time past expiry
    vi.advanceTimersByTime(RECONNECT_TOKEN_EXPIRY_MS + 1);

    // Create a fresh token that should not be expired
    const validToken = createSession("room-1", "player-3");

    const removed = cleanExpiredTokens();
    expect(removed).toBe(2);

    // Valid token should still exist
    expect(getAllReconnectTokens().has(validToken)).toBe(true);
    expect(getAllReconnectTokens().size).toBe(1);
  });

  it("RC8: creating new session for same player replaces old token effectively", () => {
    const token1 = createSession("room-1", "player-1");
    const token2 = createSession("room-1", "player-1");

    expect(token1).not.toBe(token2);

    // Both tokens exist in the map (different keys)
    const tokens = getAllReconnectTokens();
    expect(tokens.has(token1)).toBe(true);
    expect(tokens.has(token2)).toBe(true);
    expect(tokens.size).toBe(2);
  });
});
