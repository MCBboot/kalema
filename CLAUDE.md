# Kalema — Agent Instructions

## Before You Start

1. **Read `.agent/SPEC.md`** — single source of truth for all requirements
2. **Check `.agent/tasks/`** — see what other agents are working on
3. **Claim your work** — create a task file in `.agent/tasks/` before starting
4. **Read the relevant feature file** in `.agent/features/` for detailed requirements

## What is Kalema?

A real-time Arabic multiplayer Impostor game. Players join rooms, one is secretly the impostor (doesn't get the word), group votes to find them.

## Tech Stack

- **Frontend:** Next.js + React + TypeScript
- **Backend:** Node.js + Socket.IO + TypeScript
- **State:** In-memory Maps only (no DB, no Redis)
- **Words:** UTF-8 `.txt` file, one word per line
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

backend/                   # Node.js + Socket.IO backend (not yet created)
frontend/                  # Next.js + React frontend (not yet created)
```

## Rules

- **Do not start work** without reading `SPEC.md`
- **Do not modify the same files** another agent is working on (check `tasks/`)
- **When adding a feature**: update `SPEC.md` features table + create file in `features/`
- **When changing the spec**: add entry to `CHANGELOG.md`
- **For major spec changes**: save snapshot to `versions/v{X.Y.Z}.md`

## Conventions

- Language: TypeScript (strict mode)
- All UI text: Arabic
- All UI layout: RTL
- Backend is server-authoritative — never trust frontend
- Each room gets its own copy of word list (`[...defaultWords]`)
- Private data (roles) sent only to the relevant player, never broadcast
- All socket events validated server-side before processing
- Keep code simple — V1 is an MVP

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Full Spec | `.agent/SPEC.md` | All requirements, architecture, types, events |
| Changelog | `.agent/CHANGELOG.md` | Version history |
| Features | `.agent/features/*.md` | Detailed per-feature requirements |
| Type Models | `.agent/SPEC.md` §4 | Room, Player, Round, Vote, ReconnectSession |
| Socket Events | `.agent/SPEC.md` §5 | Full event contract |
| State Machine | `.agent/SPEC.md` §6 | Game phase transitions |
| Business Rules | `.agent/SPEC.md` §7 | 13 core rules |
