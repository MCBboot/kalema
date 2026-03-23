# Kalema (كلمة) — Real-Time Party Games Platform

A real-time multiplayer web game platform with Arabic + English support. Players join rooms, select a game, and play together. Built with a **game plugin architecture** so new games can be added without modifying core code.

## First Game: Impostor (المتخفي)

1. A player creates a room and becomes the admin
2. Other players join using a room code
3. Admin locks the room and selects the Impostor game
4. Admin starts a round — one random player is secretly assigned as the **impostor**
5. All other players receive the same secret **word**, but the impostor gets nothing
6. Players discuss and try to figure out who the impostor is
7. Everyone votes — if the majority identifies the impostor, they win; otherwise the impostor escapes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | Node.js + Socket.IO + TypeScript |
| State | In-memory (no database) |
| Styling | Tailwind CSS 4 |
| i18n | Arabic (ar) + English (en) |
| Proxy | Custom Next.js server (proxies WebSocket to backend) |

## Architecture

### Multi-Game Plugin System

Rooms are **game-agnostic**. Each game is a self-contained plugin:

```
Backend:  backend/src/games/impostor/    → GameDefinition implementation
Frontend: frontend/src/games/impostor/   → React component + store + locales
```

**To add a new game:**
1. Create a backend game plugin implementing `GameDefinition` interface
2. Create a frontend game component + registration
3. No core code changes needed

### Room Flow

```
Enter Name → Create/Join Room → Lock Room → Select Game → Play
                                    ↕
                              Unlock Room
```

Room statuses: `WAITING` → `LOCKED` → `PLAYING`

### Network Architecture

```
Browser ──► Frontend (Next.js custom server, port 26032)
                ├── /socket.io/*  → proxied to Backend (port 26033)
                ├── /health       → proxied to Backend
                └── /*            → Next.js pages
```

Only **port 26032** is exposed. The frontend proxies all Socket.IO traffic to the backend.

### Socket Event Namespacing

- **Core events**: `create_room`, `join_room`, `lock_room`, `select_game`, `start_game`, `stop_game`
- **Game events**: `impostor:start_round`, `impostor:advance_phase`, `impostor:submit_vote`, etc.

The backend `gameDispatcher` routes game-prefixed events to the correct plugin.

## Quick Start

### Prerequisites

- Node.js LTS (v20+)
- npm

### Install

```bash
git clone <repo-url>
cd kalema
npm install
```

### Run (Development)

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend (includes WebSocket proxy)
cd frontend
npm run dev
```

Open `http://localhost:26032` in your browser.

### Run (Production)

```bash
# Build both
cd backend && npm run build
cd ../frontend && npm run build

# Terminal 1: Start backend
cd backend
NODE_ENV=production npm start

# Terminal 2: Start frontend
cd frontend
NODE_ENV=production npm start
```

### Run with Docker

```bash
docker compose up --build
```

### Run Tests

```bash
# Backend tests (90 tests across 11 files)
cd backend && npm test
```

## Project Structure

```
kalema/
├── backend/                        # Node.js + Socket.IO server
│   └── src/
│       ├── index.ts                # Entry: registers games, starts server
│       ├── server.ts               # HTTP + Socket.IO setup
│       ├── games/                  # ★ Game plugin system
│       │   ├── types.ts            # GameDefinition interface
│       │   ├── registry.ts         # Game registration
│       │   └── impostor/           # Impostor game plugin
│       │       ├── index.ts        # Plugin implementation
│       │       ├── state.ts        # Game state types
│       │       ├── round.ts        # Round lifecycle
│       │       ├── vote.ts         # Voting + results
│       │       ├── words.ts        # Word management
│       │       ├── events.ts       # impostor:* event names
│       │       └── data/           # default-words.txt
│       ├── socket/                 # Core socket handlers
│       │   ├── registerSocketHandlers.ts  # Room management events
│       │   ├── gameDispatcher.ts          # Routes game events to plugins
│       │   └── events.ts                  # Core event names + payloads
│       ├── models/                 # Room (game-agnostic), Player
│       ├── services/               # roomService, playerService, adminService, reconnectService
│       ├── store/                  # In-memory Maps
│       ├── validators/             # Payload validation
│       ├── config/                 # Constants + environment
│       ├── utils/                  # Helpers
│       └── jobs/                   # Cleanup job
│
├── frontend/                       # Next.js + React app
│   ├── server.ts                   # Custom server (Next.js + WebSocket proxy)
│   └── src/
│       ├── app/                    # Pages (home, create, join, room/[code])
│       │   └── game-init.tsx       # Registers game plugins at startup
│       ├── i18n/                   # ★ Internationalization
│       │   ├── context.tsx         # I18nProvider + useTranslation()
│       │   └── locales/            # ar.json, en.json (~90 keys each)
│       ├── games/                  # ★ Frontend game plugins
│       │   ├── types.ts            # GameRegistration interface
│       │   ├── registry.ts         # Frontend game registry
│       │   └── impostor/           # Impostor game frontend
│       │       ├── components/     # ImpostorGame.tsx (all phases)
│       │       ├── store/          # impostorStore.tsx
│       │       └── locales/        # ar.json, en.json
│       ├── components/
│       │   ├── shared/             # Button, Input, ErrorMessage, Layout, Menu, Toast
│       │   └── room/               # PlayerList, RoomCode, GamePicker
│       ├── store/                  # Context stores (room, player, connection, theme)
│       ├── hooks/                  # Socket events, reconnect, notifications
│       ├── lib/                    # Socket client, API types
│       └── utils/                  # RTL helpers, formatters
│
├── docker-compose.yml
└── .agent/                         # AI agent collaboration files
    ├── SPEC.md                     # Full project specification
    ├── CHANGELOG.md                # Version history
    └── features/                   # Detailed feature specs (12+ files)
```

## Features

### Platform
- **Multi-game support** — plugin architecture, rooms are game-agnostic
- **i18n** — Arabic (RTL) + English (LTR) with per-game translations
- **Room system** — unique shareable codes, admin controls, 50+ players
- **Two admin modes** — observer only or admin + player
- **localStorage persistence** — survives page refresh

### Impostor Game
- Random word and impostor selection each round
- Phase-based gameplay: Choosing → Role Reveal → Discussion → Voting → Result
- Vote tallying with tie rules (impostor wins on tie)
- Offline player support (for shared-device play)

### Real-Time
- Socket.IO with core + game-namespaced events
- Full room snapshot on join/reconnect, delta updates for everything else
- Private role delivery — impostor status is never broadcast
- Automatic reconnect with token-based session recovery (5-minute window)

### Notifications
- In-app toast notifications for game events
- Browser push notifications for important events
- Connection status feedback

### Security
- Server-authoritative — all game logic runs on the backend
- Role secrecy — word sent only to non-impostors
- Input validation on every socket event
- Admin privilege checks on all admin actions

### UI
- Arabian Noir design theme (dark charcoal + amber/gold accents)
- Responsive mobile-first layout
- Arabic-compatible font (Noto Sans Arabic)
- Language switcher in menu

## Configuration

### Environment Variables

**Backend** — `backend/.env`:
```env
PORT=26033
CORS_ORIGIN=*
```

**Frontend** — `frontend/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=           # Leave empty to auto-detect
BACKEND_URL=http://localhost:26033
PORT=26032
HOSTNAME=0.0.0.0
```

### Game Constants

Core constants in `backend/src/config/constants.ts`:

| Constant | Default | Description |
|----------|---------|-------------|
| `ROOM_CODE_LENGTH` | 5 | Room code character count |
| `MAX_DISPLAY_NAME_LENGTH` | 20 | Max player name length |
| `RECONNECT_TOKEN_EXPIRY_MS` | 5 min | Reconnect window |
| `ROOM_INACTIVITY_TIMEOUT_MS` | 30 min | Stale room cleanup |
| `CLEANUP_INTERVAL_MS` | 60 sec | Cleanup job interval |

Impostor-specific: `MIN_PLAYERS_TO_START = 3` (in `games/impostor/round.ts`)

## Deployment

### Reverse Proxy

Since the frontend proxies Socket.IO traffic, your reverse proxy only forwards to **one port**:

**Nginx:**
```nginx
server {
    server_name kalema.yourdomain.com;
    location / {
        proxy_pass http://localhost:26032;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

**Caddy:**
```
kalema.yourdomain.com {
    reverse_proxy localhost:26032
}
```

## API

### Health Check

```
GET http://localhost:26032/health
→ { "status": "ok", "uptime": 123.45 }
```

### Socket Events

See [.agent/SPEC.md](.agent/SPEC.md) for the full event contract.

## Known Limitations (V1)

- **All state is in memory** — server restart loses everything
- **Single instance only** — no horizontal scaling
- **Offline players reduce privacy** — admin sees their roles
- **No persistent word changes** — added words are lost on restart
- **No timers** — phase advancement is manual (admin-controlled)

## License

Private project.
