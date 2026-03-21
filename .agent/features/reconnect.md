---
name: Reconnect & Session Recovery
status: planned
priority: medium
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [realtime, players]
---

## Description

Online players can reconnect if their socket drops, as long as the server process is still alive and their token hasn't expired.

## Requirements

### Flow
1. On join: backend creates reconnect token, sends to frontend
2. Frontend stores token locally
3. On disconnect: backend marks player as disconnected
4. On reconnect: frontend sends token → backend validates → rebinds socket → sends fresh room snapshot

### Token Expiry
- Tokens expire after 5–10 minutes
- Expired sessions cleaned up automatically

### Rejection Cases
- Room no longer exists
- Token invalid
- Token expired
- Player state no longer exists

### Data Model
```ts
interface ReconnectSession {
  token: string;
  roomId: string;
  playerId: string;
  expiresAt: number;
}
```

### In-Memory Map
```ts
const reconnectTokens = new Map<string, ReconnectSession>();
```

## Related Files

- `backend/src/services/reconnectService.ts`
- `backend/src/store/memoryStore.ts`
- `frontend/src/hooks/useReconnect.ts`
- `frontend/src/store/connectionStore.ts`

## Notes

- If server restarts, ALL reconnect sessions are lost — expected V1 behavior
