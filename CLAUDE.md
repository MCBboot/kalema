# Kalema — Agent Instructions

## Before You Start

1. **Read `.agent/SPEC.md`** — single source of truth for all requirements
2. **Check `.agent/tasks/`** — see what other agents are working on
3. **Claim your work** — create a task file in `.agent/tasks/` before starting
4. **Read the relevant feature file** in `.agent/features/` for detailed requirements

## What is Kalema?

A real-time Arabic multiplayer party game platform. Players join rooms, select a game, and play together. The first game is **Impostor** (المتخفي) — one player doesn't know the secret word, and the group votes to find them.

The app supports **multiple games** via a plugin architecture. Rooms are game-agnostic; each game lives in its own folder.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Node.js + Socket.IO + TypeScript
- **State:** In-memory Maps only (no DB, no Redis)
- **i18n:** Arabic (ar) + English (en), lightweight React context system
- **Runtime:** Node.js LTS

## Project Structure

```
.agent/                    # Agent collaboration hub
├── SPEC.md                # Central spec — READ THIS FIRST
├── CHANGELOG.md           # Version history of spec changes
├── features/              # One file per feature (detailed requirements)
├── plans/                 # Implementation plans
├── memory/                # Shared agent memory
├── tasks/                 # Active task claims (agent coordination)
└── versions/              # Versioned snapshots of SPEC.md

backend/
  src/
    index.ts               # Entry point — registers games, starts server
    server.ts              # HTTP + Socket.IO server
    games/                 # ★ Game plugin system
      types.ts             # GameDefinition, GameState, GameEventContext interfaces
      registry.ts          # registerGame(), getGame(), getAllGames()
      impostor/            # Impostor game plugin
        index.ts           # GameDefinition implementation + init
        state.ts           # ImpostorGameState, ImpostorRound, Vote types
        round.ts           # startRound(), advancePhase(), stopRound()
        vote.ts            # submitVote(), calculateResult()
        words.ts           # Word loading/management
        events.ts          # impostor:* event constants
        data/default-words.txt
    socket/
      registerSocketHandlers.ts  # Core room events + game dispatch
      gameDispatcher.ts          # Routes game-prefixed events to plugins
      events.ts                  # Core event names + payloads
    models/
      room.ts              # Room (game-agnostic: selectedGame + gameState)
      player.ts            # Player types + factories
    services/
      roomService.ts       # Room CRUD, lock/unlock, selectGame, startGame
      playerService.ts     # Player state helpers
      adminService.ts      # Transfer admin, kick, offline players
      reconnectService.ts  # Token-based session recovery
    store/memoryStore.ts   # Three Maps: rooms, sessions, tokens
    config/                # Constants + env
    validators/            # Payload validation
    utils/                 # id, random, logger, fileLoader
    jobs/                  # Cleanup background job

frontend/
  src/
    app/                   # Pages (home, create, join, room/[code])
      game-init.tsx        # Registers all game plugins at startup
    i18n/                  # ★ Internationalization system
      context.tsx          # I18nProvider + useTranslation() hook
      types.ts             # Locale, Direction types
      locales/
        ar.json            # Core Arabic translations (~90 keys)
        en.json            # Core English translations (~90 keys)
    games/                 # ★ Frontend game plugins
      types.ts             # GameRegistration, GameComponentProps
      registry.ts          # registerGame(), getGame(), getAllGames()
      impostor/            # Impostor game frontend
        index.ts           # Registration + translation loading
        components/
          ImpostorGame.tsx  # Main game orchestrator (all phases)
        store/
          impostorStore.tsx # Role/word state (replaces old secretStore)
        locales/
          ar.json           # Impostor Arabic translations
          en.json           # Impostor English translations
    components/
      room/                # PlayerList, RoomCode, GamePicker
      shared/              # Button, Input, ErrorMessage, Layout, Menu, Toast, ReconnectBanner
    store/                 # React context stores (room, player, connection, theme)
    hooks/                 # useSocketEvents, useReconnect, useGameNotifications, usePushNotifications
    lib/
      api-types.ts         # Shared types, core + impostor event constants
      socket.ts            # Socket.IO client
```

## Key Architecture: Game Plugin System

### Adding a New Game

**Backend** — create `backend/src/games/newgame/`:
1. Implement `GameDefinition` interface (from `games/types.ts`)
2. Handle game-specific events with `impostor:*` style prefixing
3. Register in `backend/src/index.ts`: `registerGame(newGame)`

**Frontend** — create `frontend/src/games/newgame/`:
1. Create a `GameComponent` (receives `room`, `myPlayerId`, `isAdmin`)
2. Add locale files in `locales/ar.json` + `en.json`
3. Register in `frontend/src/app/game-init.tsx`

**No core code changes needed** — the room model, socket handlers, and room page are all game-agnostic.

### Room Status Flow

```
WAITING → LOCKED → PLAYING
   ↑         ↓
   └─────────┘  (unlock)
```

- **WAITING**: Players can join, admin adds offline players
- **LOCKED**: Admin selects game, configures it, starts it
- **PLAYING**: Game plugin renders and handles all game logic

### Socket Event Namespacing

Core events: `create_room`, `join_room`, `lock_room`, `select_game`, `start_game`, `stop_game`, etc.
Game events: `impostor:start_round`, `impostor:advance_phase`, `impostor:submit_vote`, etc.

The `gameDispatcher.ts` routes game-prefixed events to the correct plugin.

## Rules

- **Do not start work** without reading `SPEC.md`
- **Do not modify the same files** another agent is working on (check `tasks/`)
- **When adding a feature**: update `SPEC.md` features table + create file in `features/`
- **When changing the spec**: add entry to `CHANGELOG.md`
- **For major spec changes**: save snapshot to `versions/v{X.Y.Z}.md`

## Conventions

- Language: TypeScript (strict mode)
- UI text: Localized via i18n system (Arabic default, English supported)
- UI layout: RTL for Arabic, LTR for English (dynamic via `I18nProvider`)
- Backend is server-authoritative — never trust frontend
- Game-specific state lives in `room.gameState` (opaque to core)
- Private data (roles) sent only to the relevant player, never broadcast
- All socket events validated server-side before processing
- Keep code simple — V1 is an MVP

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Full Spec | `.agent/SPEC.md` | All requirements, architecture, types, events |
| Changelog | `.agent/CHANGELOG.md` | Version history |
| Features | `.agent/features/*.md` | Detailed per-feature requirements |
| Game Plugin Types | `backend/src/games/types.ts` | GameDefinition interface |
| Socket Events | `backend/src/socket/events.ts` | Core event contract |
| Room Model | `backend/src/models/room.ts` | Game-agnostic room (WAITING/LOCKED/PLAYING) |
| API Types | `frontend/src/lib/api-types.ts` | Shared frontend types + event constants |
| i18n | `frontend/src/i18n/` | Translation system |
