# Feature: Voting System

> **Status:** implemented | **Priority:** high | **Updated:** 2026-03-23

## Overview

Voting is now part of the **Impostor game plugin** (`backend/src/games/impostor/vote.ts`).

See `features/impostor-game.md` for full details.

## Key Rules

- One vote per eligible participant
- No self-voting
- Vote during VOTING phase only
- All votes in → auto-advance to RESULT
- Tie → impostor escapes
- Admin can submit votes for offline players
