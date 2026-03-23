# Feature: Game Plugin Architecture

## Overview

Rooms are game-agnostic. Each game is a self-contained plugin that registers with the platform. The platform handles room management (create, join, leave, admin, reconnect) while games handle their own logic, state, events, and UI.

## Backend Plugin Interface

Each game implements `GameDefinition` (from `backend/src/games/types.ts`):

- `id` — unique identifier (e.g., "impostor")
- `minPlayers` / `maxPlayers` — player count requirements
- `createGameState()` — initialize game state when admin starts
- `handleEvent()` — process game-specific socket events
- `getPublicState()` — return sanitized state (no secrets) for room snapshot
- `getPlayerPrivateData()` — return private data for a specific player (e.g., role)
- `getEventNames()` — list of game-specific event names
- `getEligibleParticipants()` — which players can participate
- `onStop()` — cleanup when game is stopped

## Event Namespacing

Game events use a `{gameId}:` prefix: `impostor:start_round`, `impostor:submit_vote`, etc.

The `gameDispatcher.ts` routes these events to the correct plugin by:
1. Building a map of event name → game id from all registered games
2. Validating that `room.selectedGame` matches the game id
3. Creating a `GameEventContext` and calling `game.handleEvent()`

## Room Model

```ts
interface Room {
  // ... core fields ...
  selectedGame: string | null;   // game plugin id
  gameState: GameState | null;   // opaque to core
}
```

Room status: `WAITING` → `LOCKED` → `PLAYING`

## Frontend Plugin Interface

Each game provides a `GameRegistration` (from `frontend/src/games/types.ts`):

- `id`, `nameKey`, `descriptionKey` — identification (keys are i18n)
- `minPlayers`, `maxPlayers`, `icon` — display info
- `GameComponent` — React component receiving `{ room, myPlayerId, isAdmin }`
- `LobbyConfig?` — optional pre-game config component

## Adding a New Game

1. **Backend**: Create `games/{name}/`, implement `GameDefinition`, register in `index.ts`
2. **Frontend**: Create `games/{name}/`, provide `GameComponent` + locales, register in `game-init.tsx`
3. No core code changes needed

## Files

- `backend/src/games/types.ts`
- `backend/src/games/registry.ts`
- `backend/src/socket/gameDispatcher.ts`
- `frontend/src/games/types.ts`
- `frontend/src/games/registry.ts`
- `frontend/src/components/room/GamePicker.tsx`
