# Kalema — Project Specification

> **Version:** 0.3.0
> **Last updated:** 2026-03-21
> **Status:** Requirements defined, pre-implementation

---

## 1. Project Overview

Kalema (كلمة) is a real-time Arabic web-based multiplayer game platform. V1 includes one game: **Impostor**.

Players create or join rooms, one player is secretly assigned as the impostor (doesn't get the word), and the group votes to identify them. The entire UI is in Arabic with RTL layout.

This version is an **in-memory MVP** — no database, no Redis, single backend instance. All state is lost on restart by design.

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js + React + TypeScript |
| **Backend** | Node.js + Socket.IO + TypeScript |
| **Runtime** | Node.js LTS |
| **State** | In-memory Maps (process-local) |
| **Default words** | UTF-8 `.txt` file, one word per line |

### 2.2 NOT in V1

- No database (no Prisma, no PostgreSQL)
- No Redis
- No message broker
- No microservices
- No horizontal scaling

### 2.3 Deployment Model

- One frontend app
- One backend process
- One server instance only
- Self-hosted Node.js server or Docker

### 2.4 System Components

```
┌─────────────────────┐     Socket.IO     ┌─────────────────────┐
│   Frontend (Next.js) │ ◄──────────────► │  Backend (Node.js)   │
│   React + TypeScript │                   │  Socket.IO + TS      │
│   Arabic RTL UI      │                   │  In-Memory State     │
└─────────────────────┘                   │  Word File Loader    │
                                           └─────────────────────┘
```

### 2.5 Backend Folder Structure

```
backend/
  src/
    index.ts
    server.ts
    __tests__/
      gameLifecycle.test.ts
    socket/
      registerSocketHandlers.ts
      events.ts
    config/
      env.ts
      constants.ts
    data/
      default-words.txt
    models/
      room.ts
      player.ts
      round.ts
      vote.ts
    services/
      roomService.ts
      playerService.ts
      adminService.ts
      wordService.ts
      roundService.ts
      voteService.ts
      reconnectService.ts
      __tests__/
        roomService.test.ts
        playerService.test.ts
        adminService.test.ts
        wordService.test.ts
        roundService.test.ts
        voteService.test.ts
        reconnectService.test.ts
    store/
      memoryStore.ts
    validators/
      roomValidators.ts
      playerValidators.ts
      eventValidators.ts
      __tests__/
        roomValidators.test.ts
        playerValidators.test.ts
        eventValidators.test.ts
    utils/
      id.ts
      random.ts
      fileLoader.ts
      logger.ts
      __tests__/
        fileLoader.test.ts
        id.test.ts
        random.test.ts
    jobs/
      cleanupJob.ts
      __tests__/
        cleanupJob.test.ts
```

### 2.6 Frontend Folder Structure

```
frontend/
  src/
    app/ or pages/
    components/
      room/
      admin/
      game/
      shared/
    lib/
      socket.ts
      api-types.ts
    store/
      connectionStore.ts
      roomStore.ts
      playerStore.ts
      secretStore.ts
    hooks/
      useSocketEvents.ts
      useReconnect.ts
    utils/
      rtl.ts
      formatters.ts
    styles/
```

---

## 3. Features

| # | Feature | Status | File |
|---|---------|--------|------|
| 1 | Room creation & joining | planned | `features/rooms.md` |
| 2 | Player management (online + offline) | planned | `features/players.md` |
| 3 | Admin system (controls, modes, transfer) | planned | `features/admin.md` |
| 4 | Word management (file + runtime add) | planned | `features/words.md` |
| 5 | Game engine (rounds, roles, phases) | planned | `features/game-engine.md` |
| 6 | Voting system | planned | `features/voting.md` |
| 7 | Real-time communication (Socket.IO events) | planned | `features/realtime.md` |
| 8 | Reconnect & session recovery | planned | `features/reconnect.md` |
| 9 | Cleanup & memory management | planned | `features/cleanup.md` |
| 10 | Arabic RTL UI | planned | `features/arabic-ui.md` |
| 11 | Security & validation | planned | `features/security.md` |
| 12 | Test cases (unit, integration, E2E) | planned | `features/testing.md` |

---

## 4. Type Models

### Enums

```ts
type RoomStatus = "WAITING" | "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT" | "STOPPED";
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

### Vote

```ts
interface Vote {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: number;
}
```

### Round

```ts
interface Round {
  id: string;
  word: string;
  impostorPlayerId: string;
  phase: "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";
  votes: Vote[];
  startedAt: number;
}
```

### Room

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
  words: string[];
  currentRound: Round | null;
}
```

### Reconnect Session

```ts
interface ReconnectSession {
  token: string;
  roomId: string;
  playerId: string;
  expiresAt: number;
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

### Client → Server

| Event | Purpose |
|-------|---------|
| `create_room` | Create a new room |
| `join_room` | Join existing room by code |
| `leave_room` | Leave room |
| `reconnect_session` | Reconnect with token |
| `start_game` | Admin starts a round |
| `stop_game` | Admin stops game |
| `transfer_admin` | Admin transfers role |
| `kick_player` | Admin removes player |
| `add_offline_player` | Admin adds offline player |
| `remove_offline_player` | Admin removes offline player |
| `add_word` | Admin adds a word |
| `submit_vote` | Player submits vote |
| `advance_phase` | Admin advances phase (if manual) |

### Server → Client

| Event | Purpose |
|-------|---------|
| `room_created` | Room creation confirmed |
| `room_joined` | Join confirmed |
| `room_state_updated` | Full/delta room state |
| `player_list_updated` | Player list changed |
| `admin_changed` | Admin transferred |
| `game_started` | Round started |
| `phase_changed` | Phase transition |
| `role_assigned` | Private role delivery |
| `vote_state_updated` | Vote progress |
| `round_result` | Round outcome |
| `game_stopped` | Game stopped by admin |
| `word_added` | Word added to room |
| `action_rejected` | Structured error |
| `session_recovered` | Reconnect success |
| `player_disconnected` | Player lost connection |
| `player_reconnected` | Player reconnected |

---

## 6. Game State Machine

```
WAITING ──► ROLE_REVEAL ──► DISCUSSION ──► VOTING ──► RESULT ──► WAITING (new round)
   ▲                                                                │
   └────────────────────────────────────────────────────────────────┘

Any active phase ──► STOPPED (admin override)
```

Illegal transitions must be rejected.

---

## 7. Business Rules

1. Exactly one admin per room at all times
2. Admin mode: `ADMIN_ONLY` (observer) or `ADMIN_PLAYER` (plays too)
3. Admin can add words only — no edit, no delete
4. Default words from `.txt` file, each room gets its own copy (`[...defaultWords]`)
5. One impostor per round
6. All non-impostors get the same word
7. Only admin can start/stop game
8. Only admin can add offline players, kick players, transfer admin
9. Offline players are valid participants without socket connections
10. All state lost on restart — by design
11. Reconnect works only while same process is alive
12. Reconnect tokens expire after 5–10 minutes
13. Rooms cleaned up after 30–60 minutes of inactivity

---

## 8. Security Model

- **Server-authoritative**: backend is sole source of truth for all game state
- **Role secrecy**: word sent only to non-impostors, impostor status only to impostor
- **Never broadcast** private role data to entire room
- **Validate everything**: room existence, player membership, admin privilege, phase, payload format
- **Offline player compromise**: admin sees offline player roles (unavoidable with shared device)

---

## 9. Performance Targets

- Under 300ms perceived update time in normal conditions
- Full room snapshot on join/reconnect only
- Delta updates for routine changes (player join/leave, word added, phase change, vote progress)
- Support 50+ players per room without redesign
- Memoize player list rows, avoid full re-render on every update
- Searchable/grouped player list for large rooms

---

## 10. Error Handling

Backend returns structured errors for: invalid room code, duplicate name, unauthorized action, invalid phase transition, word validation failure, insufficient players, no words, invalid reconnect token, invalid vote target.

Frontend maps all errors to Arabic user-facing messages.

---

## 11. Logging

Backend logs: room create/delete, player join/leave, disconnect/reconnect, admin transfer, kick, offline player add/remove, word add, game start/stop, phase transitions, vote completion, cleanup actions, rejected actions.

---

## 12. UI Screens

- Home page
- Create room flow
- Join room flow
- Room lobby
- Admin control panel
- Word add panel
- Offline player control UI
- Role reveal screen
- Discussion state screen
- Voting screen
- Result screen
- Reconnect/recovery UI

All screens: Arabic text, RTL layout, Arabic-compatible font stack.

---

## 13. Acceptance Criteria

- [x] Tech stack: Next.js frontend, Node.js + Socket.IO backend
- [ ] All room/game state in memory only
- [ ] Default words from `.txt` file, one per line
- [ ] Each room gets its own copied word list
- [ ] Admin can add words (not edit/delete)
- [ ] Admin can choose observer or player mode
- [ ] Admin can add offline players
- [ ] Admin can kick players
- [ ] Admin can transfer admin role
- [ ] Reconnect works while server alive
- [ ] All state lost on restart
- [ ] 25+ players per room
- [ ] Backend validates all critical actions
- [ ] Role secrecy preserved for online players
- [ ] UI is Arabic and RTL

---

## 14. Active Goals

- [ ] Set up monorepo structure (frontend + backend)
- [ ] Create package.json, tsconfig, scripts
- [ ] Define Socket.IO event contract with payload schemas
- [ ] Build backend services skeleton
- [ ] Build frontend screens skeleton

---

## 15. Conventions

- Follow rules in `CLAUDE.md`
- One feature = one file in `.agent/features/`
- All spec changes logged in `CHANGELOG.md`
- Significant updates get versioned snapshot in `.agent/versions/`

---

## 16. Agent Coordination Rules

When multiple agents work simultaneously:

1. **Read this file first** before starting any work
2. **Claim your task** — create a file in `.agent/tasks/`
3. **Check `.agent/tasks/`** for active work by other agents
4. **Update SPEC.md** when adding new features or changing architecture
5. **Log changes** in `CHANGELOG.md`

### Task File Format

Create `.agent/tasks/{agent-id}-{task-name}.md`:

```markdown
---
agent: {agent-id}
task: {short description}
status: in_progress | completed | blocked
started: {date}
files_touched:
  - path/to/file1
  - path/to/file2
---

## What I'm doing
{description}

## Blockers
{any blockers or none}
```

---

## How to Add New Requirements

1. Add a one-line entry to the **Features** table (Section 3)
2. Create a detailed feature file in `.agent/features/{feature-name}.md`
3. Add a changelog entry in `.agent/CHANGELOG.md`
4. If major change, save snapshot to `.agent/versions/v{X.Y.Z}.md`
