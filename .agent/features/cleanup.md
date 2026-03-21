---
name: Cleanup & Memory Management
status: planned
priority: medium
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [rooms, reconnect]
---

## Description

Periodic background job removes stale rooms, expired reconnect tokens, and disconnected players to prevent memory leaks.

## Requirements

### Cleanup Job
- Runs every 60 seconds
- Removes expired reconnect tokens
- Removes inactive empty rooms
- Removes stale disconnected players if needed

### Room Cleanup Rules
- Delete room if: no connected online players remain AND inactivity timeout exceeded
- Recommended inactivity timeout: 30–60 minutes

### Why
Without cleanup, memory grows unbounded and stale rooms pile up.

## Related Files

- `backend/src/jobs/cleanupJob.ts`
- `backend/src/store/memoryStore.ts`

## Notes

- Keep cleanup logic simple for V1 — just time-based expiry
