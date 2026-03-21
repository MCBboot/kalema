---
name: Room Creation & Joining
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [realtime]
---

## Description

Users can create or join rooms. Each room has a unique code, an admin, a player list, and a word list. Room is the core container for all game state.

## Requirements

### Room Creation
- User enters display name, creates room
- System generates unique room code
- Creator becomes initial admin
- Creator selects admin mode (ADMIN_ONLY or ADMIN_PLAYER)
- Room receives a copy of default words

### Room Joining
- User enters display name + room code
- System validates: room exists, name not duplicate, payload valid
- On success: send full room state to joining player
- On failure: return structured error

### Room Data Model
- Room ID, code, created/updated timestamps
- Status: WAITING | ROLE_REVEAL | DISCUSSION | VOTING | RESULT | STOPPED
- Admin player ID, admin mode
- Players array, words array, current round

## Related Files

- `backend/src/models/room.ts`
- `backend/src/services/roomService.ts`
- `backend/src/validators/roomValidators.ts`
- `backend/src/store/memoryStore.ts`
- `frontend/src/app/` (create/join pages)

## Notes

- Room code must be short and easy to share verbally (Arabic context)
- Room cleanup handled separately (see cleanup.md)
