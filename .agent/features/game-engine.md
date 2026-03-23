# Feature: Game Engine (Plugin Architecture)

> **Status:** implemented | **Priority:** high | **Updated:** 2026-03-23

## Overview

Replaced by the game plugin architecture. The game engine is no longer a single monolith — each game is a self-contained plugin.

See `features/game-plugin.md` for the plugin system and `features/impostor-game.md` for the impostor game specifics.

## Key Change

- Old: Game logic (rounds, roles, phases) embedded in core `roundService.ts` and `voteService.ts`
- New: Game logic isolated in `backend/src/games/impostor/` plugin, core is game-agnostic
