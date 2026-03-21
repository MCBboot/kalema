import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { createServer, Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { io as ioc, Socket } from "socket.io-client";
import { registerSocketHandlers } from "../socket/registerSocketHandlers.js";
import { loadDefaultWords } from "../services/wordService.js";
import {
  getAllRooms,
  getAllReconnectTokens,
} from "../store/memoryStore.js";

// ── Globals ──

let httpServer: HttpServer;
let ioServer: Server;
let port: number;
const clients: Socket[] = [];

// ── Helpers ──

function createClient(): Promise<Socket> {
  return new Promise((resolve) => {
    const client = ioc(`http://localhost:${port}`, {
      transports: ["websocket"],
      forceNew: true,
    });
    clients.push(client);
    client.on("connect", () => resolve(client));
  });
}

function waitForEvent<T>(socket: Socket, event: string, timeoutMs = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for event: ${event}`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function cleanupClients(): Promise<void> {
  return new Promise((resolve) => {
    const toClose = clients.splice(0, clients.length);
    if (toClose.length === 0) {
      resolve();
      return;
    }
    let remaining = toClose.length;
    for (const c of toClose) {
      if (c.connected) {
        c.disconnect();
      }
      c.close();
      remaining--;
      if (remaining === 0) resolve();
    }
  });
}

function clearStore(): void {
  getAllRooms().clear();
  getAllReconnectTokens().clear();
}

// Helper: create room, return { client, roomCode, playerId, reconnectToken, roomData }
async function createRoomHelper(name = "Admin", adminMode: "ADMIN_PLAYER" | "ADMIN_ONLY" = "ADMIN_PLAYER") {
  const client = await createClient();
  const p = waitForEvent<any>(client, "room_created");
  client.emit("create_room", { displayName: name, adminMode });
  const data = await p;
  return {
    client,
    roomCode: data.room.code,
    playerId: data.playerId,
    reconnectToken: data.reconnectToken,
    roomData: data.room,
  };
}

// Helper: join an existing room
async function joinRoomHelper(code: string, name: string) {
  const client = await createClient();
  const p = waitForEvent<any>(client, "room_joined");
  client.emit("join_room", { code, displayName: name });
  const data = await p;
  return {
    client,
    playerId: data.playerId,
    reconnectToken: data.reconnectToken,
    roomData: data.room,
  };
}

// ── Setup / Teardown ──

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      loadDefaultWords();
      httpServer = createServer();
      ioServer = new Server(httpServer, { cors: { origin: "*" } });
      registerSocketHandlers(ioServer);
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        resolve();
      });
    }),
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      cleanupClients().then(() => {
        ioServer.close();
        httpServer.close(() => resolve());
      });
    }),
);

beforeEach(() => {
  clearStore();
});

afterEach(async () => {
  await cleanupClients();
  // Allow server to process disconnects
  await new Promise((r) => setTimeout(r, 50));
  clearStore();
});

// ── Tests ──

describe("Room lifecycle", () => {
  it("INT1: Create room → receive room_created with room state", async () => {
    const { roomData, playerId, reconnectToken } = await createRoomHelper("Alice");

    expect(roomData).toBeDefined();
    expect(roomData.code).toBeTruthy();
    expect(typeof roomData.code).toBe("string");
    expect(roomData.status).toBe("WAITING");
    expect(roomData.adminPlayerId).toBeTruthy();
    expect(playerId).toBeTruthy();
    expect(reconnectToken).toBeTruthy();
  });

  it("INT2: Join room → creator receives player_list_updated, joiner receives room_joined", async () => {
    const admin = await createRoomHelper("Alice");
    const playerListPromise = waitForEvent<any>(admin.client, "player_list_updated");

    const joiner = await joinRoomHelper(admin.roomCode, "Bob");

    expect(joiner.roomData).toBeDefined();
    expect(joiner.roomData.code).toBe(admin.roomCode);
    expect(joiner.playerId).toBeTruthy();

    const playerList = await playerListPromise;
    expect(playerList.players.length).toBe(2);
    const names = playerList.players.map((p: any) => p.displayName);
    expect(names).toContain("Alice");
    expect(names).toContain("Bob");
  });

  it("INT3: 3 players join → start game → all receive game_started, phase is ROLE_REVEAL", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");

    const gameStartedPromises = [
      waitForEvent<any>(admin.client, "game_started"),
      waitForEvent<any>(bob.client, "game_started"),
      waitForEvent<any>(charlie.client, "game_started"),
    ];

    const phasePromises = [
      waitForEvent<any>(admin.client, "phase_changed"),
      waitForEvent<any>(bob.client, "phase_changed"),
      waitForEvent<any>(charlie.client, "phase_changed"),
    ];

    admin.client.emit("start_game");

    const gameStartedResults = await Promise.all(gameStartedPromises);
    for (const gs of gameStartedResults) {
      expect(gs.roomStatus).toBe("ROLE_REVEAL");
    }

    const phaseResults = await Promise.all(phasePromises);
    for (const pc of phaseResults) {
      expect(pc.phase).toBe("ROLE_REVEAL");
    }
  });
});

describe("Role assignment", () => {
  it("INT4: After start → each online player receives private role_assigned (exactly 1 impostor)", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");

    const rolePromises = [
      waitForEvent<any>(admin.client, "role_assigned"),
      waitForEvent<any>(bob.client, "role_assigned"),
      waitForEvent<any>(charlie.client, "role_assigned"),
    ];

    admin.client.emit("start_game");
    const roles = await Promise.all(rolePromises);

    const impostors = roles.filter((r) => r.role === "impostor");
    const normals = roles.filter((r) => r.role === "normal");

    expect(impostors.length).toBe(1);
    expect(normals.length).toBe(2);
  });

  it("INT5: Impostor's role_assigned has role:'impostor' and NO word", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");

    const rolePromises = [
      waitForEvent<any>(admin.client, "role_assigned"),
      waitForEvent<any>(bob.client, "role_assigned"),
      waitForEvent<any>(charlie.client, "role_assigned"),
    ];

    admin.client.emit("start_game");
    const roles = await Promise.all(rolePromises);

    const impostor = roles.find((r) => r.role === "impostor");
    expect(impostor).toBeDefined();
    expect(impostor!.role).toBe("impostor");
    expect(impostor!.word).toBeUndefined();
  });

  it("INT6: Normal player's role_assigned has role:'normal' and a word string", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");

    const rolePromises = [
      waitForEvent<any>(admin.client, "role_assigned"),
      waitForEvent<any>(bob.client, "role_assigned"),
      waitForEvent<any>(charlie.client, "role_assigned"),
    ];

    admin.client.emit("start_game");
    const roles = await Promise.all(rolePromises);

    const normals = roles.filter((r) => r.role === "normal");
    expect(normals.length).toBeGreaterThanOrEqual(1);
    for (const n of normals) {
      expect(n.word).toBeTruthy();
      expect(typeof n.word).toBe("string");
    }
  });
});

describe("Phase transitions", () => {
  it("INT7: Advance through all phases → each phase_changed received with correct phase", async () => {
    const admin = await createRoomHelper("Alice");
    await joinRoomHelper(admin.roomCode, "Bob");
    await joinRoomHelper(admin.roomCode, "Charlie");

    // Start game
    const startPhase = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("start_game");
    const sp = await startPhase;
    expect(sp.phase).toBe("ROLE_REVEAL");

    // Advance to DISCUSSION
    const disc = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    const dp = await disc;
    expect(dp.phase).toBe("DISCUSSION");

    // Advance to VOTING
    const voting = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    const vp = await voting;
    expect(vp.phase).toBe("VOTING");

    // Advance to RESULT
    const result = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    const rp = await result;
    expect(rp.phase).toBe("RESULT");

    // Advance back to WAITING
    const waiting = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    const wp = await waiting;
    expect(wp.phase).toBe("WAITING");
  });
});

describe("Voting + Result", () => {
  it("INT8: All players vote → auto-advance to RESULT → round_result broadcast", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");

    // Start game
    const rolesP = [
      waitForEvent<any>(admin.client, "role_assigned"),
      waitForEvent<any>(bob.client, "role_assigned"),
      waitForEvent<any>(charlie.client, "role_assigned"),
    ];
    admin.client.emit("start_game");
    const roles = await Promise.all(rolesP);

    // Advance to DISCUSSION then VOTING
    let p = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    await p;

    p = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    await p;

    // Identify impostor index - we need player IDs
    // The first player in room is admin (Alice), index 0
    // We need to figure out who is the impostor
    const allPlayers = [
      { id: admin.playerId, client: admin.client, role: roles[0] },
      { id: bob.playerId, client: bob.client, role: roles[1] },
      { id: charlie.playerId, client: charlie.client, role: roles[2] },
    ];

    const impostor = allPlayers.find((p) => p.role.role === "impostor")!;
    const nonImpostors = allPlayers.filter((p) => p.role.role !== "impostor");

    // Set up round_result listener
    const resultPromise = waitForEvent<any>(admin.client, "round_result");

    // Everyone votes for the impostor
    for (const player of allPlayers) {
      if (player.id !== impostor.id) {
        // non-impostors vote for impostor
        player.client.emit("submit_vote", { targetPlayerId: impostor.id });
      } else {
        // impostor votes for a non-impostor
        player.client.emit("submit_vote", { targetPlayerId: nonImpostors[0].id });
      }
    }

    const result = await resultPromise;
    expect(result.impostorId).toBe(impostor.id);
    expect(result.word).toBeTruthy();
    expect(result.voteTally).toBeDefined();
    expect(result.impostorCaught).toBe(true);
  });
});

describe("Admin actions", () => {
  it("INT9: Admin kicks player → kicked player receives YOU_WERE_KICKED, removed from room", async () => {
    const admin = await createRoomHelper("Alice");

    // Set up listener for join's player_list_updated so it doesn't interfere
    const joinListPromise = waitForEvent<any>(admin.client, "player_list_updated");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    await joinListPromise; // consume the join broadcast

    const kickedPromise = waitForEvent<any>(bob.client, "action_rejected");
    const playerListPromise = waitForEvent<any>(admin.client, "player_list_updated");

    admin.client.emit("kick_player", { targetPlayerId: bob.playerId });

    const kicked = await kickedPromise;
    expect(kicked.reason).toBe("YOU_WERE_KICKED");

    const playerList = await playerListPromise;
    expect(playerList.players.length).toBe(1);
    expect(playerList.players[0].displayName).toBe("Alice");
  });

  it("INT10: Admin transfers admin → admin_changed broadcast, new admin confirmed", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");

    const adminChangedPromise = waitForEvent<any>(bob.client, "admin_changed");

    admin.client.emit("transfer_admin", { targetPlayerId: bob.playerId });

    const changed = await adminChangedPromise;
    expect(changed.newAdminPlayerId).toBe(bob.playerId);
  });
});

describe("Disconnect/Reconnect", () => {
  it("INT11: Player disconnects → player_disconnected broadcast", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");

    const disconnectedPromise = waitForEvent<any>(admin.client, "player_disconnected");

    // Remove bob from our tracking so cleanupClients doesn't double-disconnect
    const bobIdx = clients.indexOf(bob.client);
    if (bobIdx >= 0) clients.splice(bobIdx, 1);

    bob.client.disconnect();

    const disconnected = await disconnectedPromise;
    expect(disconnected.playerId).toBe(bob.playerId);
    expect(disconnected.displayName).toBe("Bob");
  });

  it("INT12: Player reconnects with valid token → session_recovered with room state", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");

    const token = bob.reconnectToken;

    // Disconnect bob
    const disconnectedPromise = waitForEvent<any>(admin.client, "player_disconnected");
    const bobIdx = clients.indexOf(bob.client);
    if (bobIdx >= 0) clients.splice(bobIdx, 1);
    bob.client.disconnect();
    await disconnectedPromise;

    // Reconnect with new client
    const newClient = await createClient();
    const recoveredPromise = waitForEvent<any>(newClient, "session_recovered");
    const reconnectedPromise = waitForEvent<any>(admin.client, "player_reconnected");

    newClient.emit("reconnect_session", { token });

    const recovered = await recoveredPromise;
    expect(recovered.room).toBeDefined();
    expect(recovered.playerId).toBe(bob.playerId);
    expect(recovered.reconnectToken).toBeTruthy();

    const reconnected = await reconnectedPromise;
    expect(reconnected.playerId).toBe(bob.playerId);
  });

  it("INT13: Player reconnects with invalid token → action_rejected", async () => {
    const client = await createClient();
    const rejectedPromise = waitForEvent<any>(client, "action_rejected");

    client.emit("reconnect_session", { token: "invalid-token-12345" });

    const rejected = await rejectedPromise;
    expect(rejected.event).toBe("reconnect_session");
    expect(rejected.reason).toBe("INVALID_TOKEN");
  });
});

describe("Other actions", () => {
  it("INT14: Add offline player → player_list_updated broadcast with offline player", async () => {
    const admin = await createRoomHelper("Alice");

    const playerListPromise = waitForEvent<any>(admin.client, "player_list_updated");

    admin.client.emit("add_offline_player", { displayName: "OfflineDan" });

    const playerList = await playerListPromise;
    expect(playerList.players.length).toBe(2);
    const offlinePlayer = playerList.players.find((p: any) => p.displayName === "OfflineDan");
    expect(offlinePlayer).toBeDefined();
    expect(offlinePlayer.type).toBe("OFFLINE");
    expect(offlinePlayer.isConnected).toBe(false);
  });

  it("INT15: Add word → word_added broadcast", async () => {
    const admin = await createRoomHelper("Alice");

    const wordAddedPromise = waitForEvent<any>(admin.client, "word_added");

    admin.client.emit("add_word", { word: "TestWord123" });

    const wordAdded = await wordAddedPromise;
    expect(wordAdded.words).toBeDefined();
    expect(wordAdded.words).toContain("TestWord123");
  });
});

describe("Error cases", () => {
  it("INT16: Non-admin tries admin action → action_rejected UNAUTHORIZED", async () => {
    const admin = await createRoomHelper("Alice");
    const bob = await joinRoomHelper(admin.roomCode, "Bob");

    const rejectedPromise = waitForEvent<any>(bob.client, "action_rejected");

    bob.client.emit("start_game");

    const rejected = await rejectedPromise;
    expect(rejected.event).toBe("start_game");
    expect(rejected.reason).toBe("UNAUTHORIZED");
  });

  it("INT17: Join with duplicate name → action_rejected DUPLICATE_NAME", async () => {
    const admin = await createRoomHelper("Alice");

    const client2 = await createClient();
    const rejectedPromise = waitForEvent<any>(client2, "action_rejected");

    client2.emit("join_room", { code: admin.roomCode, displayName: "Alice" });

    const rejected = await rejectedPromise;
    expect(rejected.event).toBe("join_room");
    expect(rejected.reason).toBe("DUPLICATE_NAME");
  });

  it("INT18: Start game with insufficient players → action_rejected INSUFFICIENT_PLAYERS", async () => {
    const admin = await createRoomHelper("Alice");

    const rejectedPromise = waitForEvent<any>(admin.client, "action_rejected");

    admin.client.emit("start_game");

    const rejected = await rejectedPromise;
    expect(rejected.event).toBe("start_game");
    expect(rejected.reason).toBe("INSUFFICIENT_PLAYERS");
  });
});

describe("Scale test", () => {
  it("INT19: 10 players join room → all receive updates", async () => {
    const admin = await createRoomHelper("Player0");
    const joiners: Array<{ client: Socket; playerId: string }> = [];

    for (let i = 1; i < 10; i++) {
      const joiner = await joinRoomHelper(admin.roomCode, `Player${i}`);
      joiners.push(joiner);
    }

    // Verify all 10 players are in the room by having admin listen for player_list_updated
    // The last join should have triggered a broadcast to admin with all 10 players
    // We already joined them all, so let's verify by starting a game
    const gameStartedPromises = [
      waitForEvent<any>(admin.client, "game_started"),
      ...joiners.map((j) => waitForEvent<any>(j.client, "game_started")),
    ];

    admin.client.emit("start_game");

    const results = await Promise.all(gameStartedPromises);
    expect(results.length).toBe(10);
    for (const r of results) {
      expect(r.roomStatus).toBe("ROLE_REVEAL");
    }
  });
});

describe("Full lifecycle", () => {
  it("INT20: Complete cycle: create → join → start → advance phases → vote → result → verify", async () => {
    // 1. Create room
    const admin = await createRoomHelper("Alice");
    expect(admin.roomData.status).toBe("WAITING");

    // 2. Join 3 players (total 4 including admin)
    const bob = await joinRoomHelper(admin.roomCode, "Bob");
    const charlie = await joinRoomHelper(admin.roomCode, "Charlie");
    const diana = await joinRoomHelper(admin.roomCode, "Diana");

    const allPlayers = [
      { id: admin.playerId, client: admin.client, role: null as any },
      { id: bob.playerId, client: bob.client, role: null as any },
      { id: charlie.playerId, client: charlie.client, role: null as any },
      { id: diana.playerId, client: diana.client, role: null as any },
    ];

    // 3. Start game
    const rolePromises = allPlayers.map((p) =>
      waitForEvent<any>(p.client, "role_assigned"),
    );
    const gameStartedPromises = allPlayers.map((p) =>
      waitForEvent<any>(p.client, "game_started"),
    );

    admin.client.emit("start_game");

    const gsResults = await Promise.all(gameStartedPromises);
    for (const gs of gsResults) {
      expect(gs.roomStatus).toBe("ROLE_REVEAL");
    }

    const roles = await Promise.all(rolePromises);
    for (let i = 0; i < allPlayers.length; i++) {
      allPlayers[i].role = roles[i];
    }

    // Verify exactly 1 impostor
    const impostorCount = allPlayers.filter((p) => p.role.role === "impostor").length;
    expect(impostorCount).toBe(1);

    // 4. Advance to DISCUSSION
    let phaseP = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    let phase = await phaseP;
    expect(phase.phase).toBe("DISCUSSION");

    // 5. Advance to VOTING
    phaseP = waitForEvent<any>(admin.client, "phase_changed");
    admin.client.emit("advance_phase");
    phase = await phaseP;
    expect(phase.phase).toBe("VOTING");

    // 6. All vote
    const impostor = allPlayers.find((p) => p.role.role === "impostor")!;
    const nonImpostors = allPlayers.filter((p) => p.role.role !== "impostor");

    const resultPromise = waitForEvent<any>(admin.client, "round_result");

    for (const player of allPlayers) {
      if (player.id !== impostor.id) {
        player.client.emit("submit_vote", { targetPlayerId: impostor.id });
      } else {
        player.client.emit("submit_vote", { targetPlayerId: nonImpostors[0].id });
      }
    }

    // 7. Verify result
    const result = await resultPromise;
    expect(result.impostorId).toBe(impostor.id);
    expect(result.word).toBeTruthy();
    expect(typeof result.word).toBe("string");
    expect(result.impostorCaught).toBe(true);
    expect(result.voteTally).toBeDefined();
    expect(result.voteTally[impostor.id]).toBeGreaterThanOrEqual(1);
  });
});
