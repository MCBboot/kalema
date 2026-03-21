---
name: Admin System
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [rooms, players]
---

## Description

One admin per room. Admin controls room and game flow. Two modes: observer-only or admin+player.

## Requirements

### Admin Modes
- **ADMIN_ONLY**: controls room, not a player, no role, no vote
- **ADMIN_PLAYER**: controls room AND plays (gets role, can vote)

### Admin Powers
- Start / stop game
- Add words to room
- Add offline players
- Remove (kick) any player
- Transfer admin to another player

### Admin Transfer
- Admin can manually transfer role to any player in room
- On admin disconnect/leave without transfer: auto-assign to eligible remaining player
- Exactly one admin must exist at all times

### Kick Player
- Online: disconnect socket + remove from room
- Offline: remove from room state

## Related Files

- `backend/src/services/adminService.ts`
- `frontend/src/components/admin/` (control panel)

## Notes

- All admin actions validated server-side
- Admin badge clearly visible in player list UI
