# Kalema — Project Specification

> **Version:** 1.0.0
> **Last updated:** 2026-03-23
> **Status:** Implemented — multi-game platform with Impostor as first game

---

## 1. Project Overview

Kalema (كلمة) is a real-time web-based multiplayer party game platform supporting Arabic + English. The platform uses a **game plugin architecture** — rooms are game-agnostic, and each game is a self-contained module.

V1 includes one game: **Impostor** (المتخفي). Players create or join rooms, the admin selects a game, and everyone plays. The entire UI supports Arabic (RTL) and English (LTR) via i18n.

This version is an **in-memory MVP** — no database, no Redis, single backend instance. All state is lost on restart by design.

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| **Backend** | Node.js + Socket.IO + TypeScript |
| **Runtime** | Node.js LTS |
| **State** | In-memory Maps (process-local) |
| **i18n** | Custom React context (ar + en) |
| **Default words** | UTF-8 `.txt` file per game |

### 2.2 NOT in V1

- No database (no Prisma, no PostgreSQL)
- No Redis
- No message broker
- No microservices
- No horizontal scaling

### 2.3 Deployment Model

- One frontend app (Next.js custom server with WebSocket proxy)
- One backend process
- One server instance only
- Self-hosted Node.js server or Docker
- Single port exposed (26032), backend proxied internally

### 2.4 System Components

```
┌──────────────────────────┐     Socket.IO     ┌──────────────────────────┐
│  Frontend (Next.js:26032) │ ◄──────────────► │  Backend (Node.js:26033)  │
│  React + TypeScript       │    (proxied)      │  Socket.IO + TS          │
│  i18n (ar/en)             │                   │  Game Plugin System      │
│  Game Plugin Rendering    │                   │  In-Memory State         │
└──────────────────────────┘                   └──────────────────────────┘
```

### 2.5 Backend Folder Structure

```
backend/src/
  index.ts                          # Entry: register games, start server
  server.ts                         # HTTP + Socket.IO setup
  games/                            # ★ Game plugin system
    types.ts                        # GameDefinition, GameState, GameEventContext
    registry.ts                     # registerGame(), getGame(), getAllGames()
    impostor/                       # Impostor game plugin
      index.ts                      # GameDefinition implementation
      state.ts                      # ImpostorGameState, ImpostorRound, Vote
      round.ts                      # startRound(), advancePhase(), stopRound()
      vote.ts                       # submitVote(), calculateResult()
      words.ts                      # loadImpostorWords(), addWord()
      events.ts                     # impostor:* event constants
      data/default-words.txt        # 150 Arabic words
  socket/
    registerSocketHandlers.ts       # Core room events
    gameDispatcher.ts               # Routes game-prefixed events to plugins
    events.ts                       # Core event names + payloads
  models/
    room.ts                         # Room (game-agnostic)
    player.ts                       # Player types + factories
  services/
    roomService.ts                  # Room CRUD, lock/unlock, selectGame, startGame
    playerService.ts                # Player state helpers
    adminService.ts                 # Admin controls
    reconnectService.ts             # Token-based session recovery
  store/memoryStore.ts              # rooms, socketToSession, reconnectTokens Maps
  validators/                       # Payload validation
  config/                           # Constants + env
  utils/                            # id, random, logger, fileLoader
  jobs/                             # Cleanup background job
```

### 2.6 Frontend Folder Structure

```
frontend/src/
  app/                              # Pages: /, /create, /join, /room/[code]
    game-init.tsx                   # Registers all game plugins at startup
  i18n/                             # ★ Internationalization
    context.tsx                     # I18nProvider + useTranslation()
    types.ts                        # Locale, Direction types
    locales/ar.json                 # Core Arabic translations (~90 keys)
    locales/en.json                 # Core English translations (~90 keys)
  games/                            # ★ Frontend game plugins
    types.ts                        # GameRegistration, GameComponentProps
    registry.ts                     # Frontend game registry
    impostor/                       # Impostor game frontend
      index.ts                      # Registration + translation loading
      components/ImpostorGame.tsx   # Main game orchestrator (all phases)
      store/impostorStore.tsx       # Role/word state
      locales/ar.json               # Impostor Arabic translations
      locales/en.json               # Impostor English translations
  components/
    room/                           # PlayerList, RoomCode, GamePicker
    shared/                         # Button, Input, ErrorMessage, Layout, Menu, Toast, ReconnectBanner
  store/                            # React context: roomStore, playerStore, connectionStore, themeStore
  hooks/                            # useSocketEvents, useReconnect, useGameNotifications, usePushNotifications
  lib/
    api-types.ts                    # Shared types + core/impostor event constants
    socket.ts                       # Socket.IO client singleton
  utils/                            # rtl.ts, formatters.ts
```

---

## 3. Features

| # | Feature | Status | File |
|---|---------|--------|------|
| 1 | Room creation & joining | implemented | `features/rooms.md` |
| 2 | Player management (online + offline) | implemented | `features/players.md` |
| 3 | Admin system (controls, modes, transfer) | implemented | `features/admin.md` |
| 4 | Game plugin architecture | implemented | `features/game-plugin.md` |
| 5 | Impostor game (rounds, roles, phases, voting) | implemented | `features/impostor-game.md` |
| 6 | Real-time communication (Socket.IO events) | implemented | `features/realtime.md` |
| 7 | Reconnect & session recovery | implemented | `features/reconnect.md` |
| 8 | Cleanup & memory management | implemented | `features/cleanup.md` |
| 9 | i18n — Arabic + English | implemented | `features/i18n.md` |
| 10 | Security & validation | implemented | `features/security.md` |
| 11 | Test cases (unit, integration) | implemented | `features/testing.md` |

---

## 4. Type Models

### Core Enums

```ts
type RoomStatus = "WAITING" | "LOCKED" | "PLAYING";
type AdminMode = "ADMIN_ONLY" | "ADMIN_PLAYER";
type PlayerType = "ONLINE" | "OFFLINE";
```

### Player

```ts
interface Player {
  id: string;
  displayName: string;
  type: PlayerType;
  isAdmin: boolean;
  isConnected: boolean;
  socketId: string | null;
  joinedAt: number;
}
```

### Room (Game-Agnostic)

```ts
interface Room {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  adminPlayerId: string;
  adminMode: AdminMode;
  players: Player[];
  selectedGame: string | null;   // game plugin id
  gameState: GameState | null;   // opaque game state
}
```

### GameState (Plugin Interface)

```ts
interface GameState {
  gameId: string;
  phase: string;
  data: unknown;
}

interface GameDefinition {
  id: string;
  minPlayers: number;
  maxPlayers: number;
  createGameState(room: Room, config?: unknown): GameState;
  handleEvent(ctx: GameEventContext, eventName: string, payload: unknown): void;
  getPublicState(state: GameState): unknown;
  getPlayerPrivateData(state: GameState, playerId: string): unknown | null;
  getEventNames(): string[];
  getEligibleParticipants(room: Room): Player[];
  onStop?(state: GameState): void;
}
```

### Impostor-Specific Types

```ts
type ImpostorPhase = "CHOOSING" | "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";

interface ImpostorGameState extends GameState {
  gameId: "impostor";
  phase: ImpostorPhase;
  data: {
    words: string[];
    currentRound: ImpostorRound | null;
  };
}
```

### In-Memory Store

```ts
const rooms = new Map<string, Room>();
const socketToSession = new Map<string, SocketSession>();
const reconnectTokens = new Map<string, ReconnectSession>();
```

---

## 5. Socket Event Contract

### Core: Client → Server

| Event | Purpose |
|-------|---------|
| `create_room` | Create a new room |
| `join_room` | Join existing room by code |
| `leave_room` | Leave room |
| `reconnect_session` | Reconnect with token |
| `lock_room` | Lock room (WAITING → LOCKED) |
| `unlock_room` | Unlock room (LOCKED → WAITING) |
| `select_game` | Admin selects a game plugin |
| `start_game` | Admin starts the selected game |
| `stop_game` | Admin stops game |
| `transfer_admin` | Admin transfers role |
| `kick_player` | Admin removes player |
| `add_offline_player` | Admin adds offline player |
| `remove_offline_player` | Admin removes offline player |

### Core: Server → Client

| Event | Purpose |
|-------|---------|
| `room_created` | Room creation confirmed |
| `room_joined` | Join confirmed |
| `room_state_updated` | Full room state update |
| `player_list_updated` | Player list changed |
| `admin_changed` | Admin transferred |
| `game_selected` | Game plugin selected |
| `game_started` | Game started (with public game state) |
| `game_stopped` | Game stopped by admin |
| `game_state_updated` | Game state changed |
| `game_player_data` | Private player data from game plugin |
| `action_rejected` | Structured error |
| `session_recovered` | Reconnect success |
| `player_disconnected` | Player lost connection |
| `player_reconnected` | Player reconnected |

### Impostor Game Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `impostor:start_round` | C→S | Start a new round |
| `impostor:advance_phase` | C→S | Advance game phase |
| `impostor:submit_vote` | C→S | Submit vote |
| `impostor:add_word` | C→S | Add word to word list |
| `impostor:role_assigned` | S→C | Private role delivery |
| `impostor:phase_changed` | S→C | Phase transition |
| `impostor:vote_state_updated` | S→C | Vote progress |
| `impostor:round_result` | S→C | Round outcome |
| `impostor:word_added` | S→C | Word added |

---

## 6. Game State Machine

### Room Status

```
WAITING ──► LOCKED ──► PLAYING
   ▲           │
   └───────────┘ (unlock)
```

### Impostor Game Phases (within PLAYING)

```
CHOOSING ──► ROLE_REVEAL ──► DISCUSSION ──► VOTING ──► RESULT ──► CHOOSING
```

---

## 7. Business Rules

1. Exactly one admin per room at all times
2. Admin mode: `ADMIN_ONLY` (observer) or `ADMIN_PLAYER` (plays too)
3. Rooms are game-agnostic — `selectedGame` and `gameState` hold game-specific data
4. Game plugins handle their own events, state, and private data
5. Only admin can lock/unlock room, select game, start/stop game
6. Only admin can add offline players, kick players, transfer admin
7. Offline players are valid participants without socket connections
8. All state lost on restart — by design
9. Reconnect works only while same process is alive
10. Reconnect tokens expire after 5 minutes
11. Rooms cleaned up after 30 minutes of inactivity
12. Game-specific rules (e.g., impostor: one impostor per round, all non-impostors get same word)

---

## 8. Security Model

- **Server-authoritative**: backend is sole source of truth for all game state
- **Game isolation**: game events are namespaced and validated against `room.selectedGame`
- **Role secrecy**: private player data (from `getPlayerPrivateData`) sent only to that player
- **Never broadcast** private game data to entire room
- **Validate everything**: room existence, player membership, admin privilege, game match, phase, payload

---

## 9. i18n System

- **Locales**: Arabic (ar, default) + English (en)
- **Implementation**: React context (`I18nProvider`) + `useTranslation()` hook
- **Storage**: locale persisted to localStorage (`kalema_locale`)
- **Layout**: `dir` attribute toggles `rtl`/`ltr` based on locale
- **Game translations**: each game module registers its own translations
- **Interpolation**: `t("key", { name: "value" })` → `"Hello, value"`
- **Fallback**: missing keys fall back to Arabic

---

## 10. Agent Coordination Rules

When multiple agents work simultaneously:

1. **Read this file first** before starting any work
2. **Claim your task** — create a file in `.agent/tasks/`
3. **Check `.agent/tasks/`** for active work by other agents
4. **Update SPEC.md** when adding new features or changing architecture
5. **Log changes** in `CHANGELOG.md`

---

## How to Add a New Game

### Backend

1. Create `backend/src/games/{game-name}/` with:
   - `index.ts` — implement `GameDefinition` interface
   - `state.ts` — game-specific types
   - `events.ts` — `{game-name}:*` event constants
   - Additional files as needed (round logic, voting, etc.)
2. Register in `backend/src/index.ts`:
   ```ts
   import { newGame, initNewGame } from "./games/newgame/index.js";
   initNewGame();
   registerGame(newGame);
   ```

### Frontend

1. Create `frontend/src/games/{game-name}/` with:
   - `components/{GameName}Game.tsx` — main game component
   - `store/` — game-specific state (if needed)
   - `locales/ar.json` + `en.json` — translations
   - `index.ts` — register game + translations
2. Register in `frontend/src/app/game-init.tsx`:
   ```ts
   import { registerNewGame } from "@/games/newgame/index";
   registerNewGame();
   ```
