# Changelog

All notable changes to the project specification and features are documented here.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking architecture changes
- **MINOR**: New features added
- **PATCH**: Small updates, clarifications, fixes

---

## v1.0.0 — 2026-03-23

- **BREAKING**: Restructured into multi-game platform with game plugin architecture
- Room model refactored: `RoomStatus` is now `WAITING | LOCKED | PLAYING` (was 7 values)
- Room model: removed `words` and `currentRound`, added `selectedGame` and `gameState`
- Created `backend/src/games/` plugin system with `GameDefinition` interface, registry, and dispatcher
- Extracted impostor game into `backend/src/games/impostor/` (round, vote, words, events, state)
- Split socket handler monolith (738 lines) into `roomHandlers` + `gameDispatcher`
- Game events are now namespaced: `impostor:start_round`, `impostor:advance_phase`, etc.
- New core events: `select_game`, `game_selected`, `lock_room`, `unlock_room`
- Added `impostor:start_round` event for starting rounds within the impostor game
- Created frontend i18n system: `I18nProvider`, `useTranslation()`, ar.json + en.json (~90 keys each)
- Created frontend game plugin system: `GameRegistration`, `GameComponentProps`, registry
- Built `ImpostorGame.tsx` — single orchestrator component for all impostor phases
- Created `GamePicker.tsx` — game selection grid for locked rooms
- Created `impostorStore.tsx` — replaces old `secretStore.tsx`
- Room page now has 3 states: WAITING (lobby), LOCKED (game picker), PLAYING (game plugin)
- Replaced hardcoded Arabic strings with `t()` calls in home page, room page, notifications
- Deleted old files: `roundService`, `voteService`, `wordService`, `secretStore`, `components/game/`, `components/admin/`
- Updated all tests (90 passing across 11 files)
- Updated CLAUDE.md, README.md, SPEC.md with new architecture docs

## v0.3.0 — 2026-03-21

- Added comprehensive test cases specification (`features/testing.md`)
- 24 backend unit test cases for roomService
- 11 backend unit test cases for playerService
- 16 backend unit test cases for adminService
- 12 backend unit test cases for wordService
- 24 backend unit test cases for roundService
- 16 backend unit test cases for voteService
- 8 backend unit test cases for reconnectService
- 6 backend validator test cases
- 8 backend utility test cases
- 4 backend cleanup job test cases
- 20 backend integration test cases (full Socket.IO lifecycle)
- 32 frontend component test cases
- 7 frontend store test cases
- 20 E2E smoke test scenarios (manual checklist)
- Test framework: Vitest (backend + frontend), React Testing Library (frontend)
- Test structure: `__tests__/` directories co-located with source

## v0.2.0 — 2026-03-21

- Defined full technical requirements for V1
- Defined full system requirements specification
- Tech stack finalized: Next.js + React + TypeScript (frontend), Node.js + Socket.IO + TypeScript (backend)
- Storage: in-memory Maps only, default words from `.txt` file
- Defined backend folder structure (services, models, validators, store, socket, jobs, utils)
- Defined frontend folder structure (components, store, hooks, lib, styles)
- Added TypeScript type models: Room, Player, Round, Vote, ReconnectSession
- Defined full Socket.IO event contract (14 client→server, 16 server→client)
- Defined game state machine (WAITING → ROLE_REVEAL → DISCUSSION → VOTING → RESULT)
- Defined 13 business rules
- Defined security model (server-authoritative, role secrecy)
- Defined performance targets (300ms, 50+ players, delta updates)
- Defined error handling and logging requirements
- Listed 12 UI screens (all Arabic RTL)
- Created 11 feature files in `.agent/features/`
- Defined acceptance criteria checklist

## v0.1.0 — 2026-03-21

- Initial project setup
- Created agent collaboration structure (`.agent/`)
- Created SPEC.md with project overview, conventions, and coordination rules
- Created feature template and changelog
- Tech stack: TypeScript / Node.js (details TBD)
