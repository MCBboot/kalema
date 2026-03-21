# Kalema (كلمة) — Real-Time Arabic Impostor Game

A real-time multiplayer web game where players join rooms and try to identify the impostor — the one player who doesn't know the secret word. Built with an Arabic RTL interface.

## How It Works

1. A player creates a room and becomes the admin
2. Other players join using a room code
3. Admin starts the game — one random player is secretly assigned as the **impostor**
4. All other players receive the same secret **word**, but the impostor gets nothing
5. Players discuss and try to figure out who the impostor is
6. Everyone votes — if the majority identifies the impostor, they win; otherwise the impostor escapes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | Node.js + Socket.IO + TypeScript |
| State | In-memory (no database) |
| Styling | Tailwind CSS 4 |

## Quick Start

### Prerequisites

- Node.js LTS (v20+)
- npm

### Install & Run

```bash
# Install all dependencies
npm install

# Run both backend and frontend together
npm run dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:3000`

Open `http://localhost:3000` in your browser.

### Run Separately

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Build

```bash
# Build both
npm run build

# Start both
npm start
```

### Run Tests

```bash
# All tests (131 tests across 14 files)
npm test

# Backend only
npm run test:backend
```

## Project Structure

```
kalema/
├── backend/                    # Node.js + Socket.IO server
│   └── src/
│       ├── index.ts            # Entry point
│       ├── server.ts           # HTTP server + Socket.IO + health endpoint
│       ├── socket/             # Event handlers & contract
│       ├── services/           # Business logic
│       │   ├── roomService     # Room CRUD
│       │   ├── playerService   # Player management
│       │   ├── adminService    # Admin controls
│       │   ├── wordService     # Word loading & management
│       │   ├── roundService    # Game engine & phases
│       │   ├── voteService     # Voting & results
│       │   └── reconnectService # Session recovery
│       ├── store/              # In-memory state (Maps)
│       ├── models/             # TypeScript types & factories
│       ├── validators/         # Payload validation
│       ├── jobs/               # Cleanup background job
│       ├── config/             # Environment & constants
│       ├── utils/              # Helpers (id, random, logger, file loader)
│       └── data/               # default-words.txt (40 Arabic words)
│
├── frontend/                   # Next.js + React app
│   └── src/
│       ├── app/                # Pages (home, create, join, room/[code])
│       ├── components/
│       │   ├── shared/         # Button, Input, ErrorMessage, Layout, ReconnectBanner
│       │   ├── room/           # PlayerList, RoomCode
│       │   ├── admin/          # AdminPanel, PlayerManagement, WordPanel, OfflineVoting
│       │   └── game/           # RoleReveal, Discussion, VotingScreen, ResultScreen,
│       │                         GameControls, PhaseIndicator, VoteProgress
│       ├── store/              # React context stores (room, player, secret, connection)
│       ├── hooks/              # useSocketEvents, useReconnect
│       ├── lib/                # Socket client, shared API types
│       └── utils/              # RTL helpers, formatters
│
└── .agent/                     # AI agent collaboration files
    ├── SPEC.md                 # Full project specification
    ├── CHANGELOG.md            # Version history
    └── features/               # Detailed feature specs (11 files)
```

## Features

### Game
- Room creation with unique shareable codes
- Two admin modes: **observer only** or **admin + player**
- 50+ players per room
- Random word and impostor selection each round
- Phase-based gameplay: Waiting → Role Reveal → Discussion → Voting → Result
- Vote tallying with tie rules (impostor wins on tie)

### Admin Controls
- Start/stop game
- Kick players
- Transfer admin role
- Add/remove offline players (for shared-device play)
- Add custom words to the room

### Words
- 40 default Arabic words loaded from `backend/src/data/default-words.txt`
- Each room gets its own copy — admin can add more at runtime
- Words are never edited or deleted, only added

### Real-Time
- Socket.IO with 13 client→server and 16 server→client events
- Full room snapshot on join/reconnect, delta updates for everything else
- Private role delivery — impostor status is never broadcast

### Reconnect
- Automatic reconnect with token-based session recovery
- Tokens expire after 5 minutes
- Visual reconnect banner with Arabic feedback

### Security
- Server-authoritative — all game logic runs on the backend
- Role secrecy — word sent only to non-impostors
- Input validation on every socket event
- Admin privilege checks on all admin actions

### Arabic UI
- Full Arabic interface with RTL layout
- Arabic error messages for all error codes
- Arabic-compatible font (Noto Sans Arabic)

## Configuration

### Environment Variables

Create `backend/.env` (see `backend/.env.example`):

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

Frontend uses `NEXT_PUBLIC_SOCKET_URL` (defaults to `http://localhost:3001`).

### Game Constants

Edit `backend/src/config/constants.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `ROOM_CODE_LENGTH` | 5 | Room code character count |
| `MAX_DISPLAY_NAME_LENGTH` | 20 | Max player name length |
| `MIN_PLAYERS_TO_START` | 3 | Minimum players to start a round |
| `RECONNECT_TOKEN_EXPIRY_MS` | 5 min | Reconnect window |
| `ROOM_INACTIVITY_TIMEOUT_MS` | 30 min | Stale room cleanup |
| `CLEANUP_INTERVAL_MS` | 60 sec | Cleanup job interval |

## API

### Health Check

```
GET http://localhost:3001/health
→ { "status": "ok", "uptime": 123.45 }
```

### Socket Events

See [.agent/SPEC.md](.agent/SPEC.md) sections 5-6 for the full event contract and state machine.

## Known Limitations (V1)

- **All state is in memory** — server restart loses everything
- **Single instance only** — no horizontal scaling
- **Offline players reduce privacy** — admin sees their roles
- **No persistent word changes** — added words are lost on restart
- **No timers** — phase advancement is manual (admin-controlled)

## License

Private project.
