---
name: Player Management
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [rooms]
---

## Description

Two player types: ONLINE (connected via socket) and OFFLINE (added by admin, no socket). Both are valid game participants.

## Requirements

### Online Players
- Connect via socket, get session
- Can reconnect (see reconnect.md)
- Receive direct socket events
- Must have unique display name in room

### Offline Players
- Created by admin via `add_offline_player`
- No socket connection
- Represented through admin device UI
- Admin mediates their role reveal and voting

### Display Name Validation
- Reject empty names
- Reject whitespace-only names
- Reject duplicates within same room
- Reject names exceeding max length

### Player Data Model
```ts
interface Player {
  id: string;
  displayName: string;
  type: "ONLINE" | "OFFLINE";
  isAdmin: boolean;
  isConnected: boolean;
  socketId: string | null;
  joinedAt: number;
}
```

## Related Files

- `backend/src/models/player.ts`
- `backend/src/services/playerService.ts`
- `backend/src/validators/playerValidators.ts`
- `frontend/src/components/room/` (player list)

## Notes

- Room must support 50+ players
- Frontend needs efficient list rendering for large rooms
- Searchable/grouped display (online vs offline) recommended
