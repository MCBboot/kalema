# Feature: Room Creation & Joining

> **Status:** implemented | **Priority:** high | **Updated:** 2026-03-23

## Overview

Players create or join rooms using unique codes. Rooms are **game-agnostic** — they hold players and delegate game logic to plugins.

## Room Status

```
WAITING → LOCKED → PLAYING
   ↑         ↓
   └─────────┘  (unlock)
```

- **WAITING**: Players can join, admin manages players
- **LOCKED**: No new joins, admin selects game and configures it
- **PLAYING**: Game plugin is active

## Room Model

```ts
interface Room {
  id: string;
  code: string;
  status: "WAITING" | "LOCKED" | "PLAYING";
  adminPlayerId: string;
  adminMode: "ADMIN_ONLY" | "ADMIN_PLAYER";
  players: Player[];
  selectedGame: string | null;
  gameState: GameState | null;
  createdAt: number;
  updatedAt: number;
}
```

## Files

- `backend/src/models/room.ts`
- `backend/src/services/roomService.ts`
- `backend/src/socket/registerSocketHandlers.ts`
- `frontend/src/app/room/[code]/page.tsx`
- `frontend/src/store/roomStore.tsx`
