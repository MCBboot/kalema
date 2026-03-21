# Changelog

All notable changes to the project specification and features are documented here.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking architecture changes
- **MINOR**: New features added
- **PATCH**: Small updates, clarifications, fixes

---

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
