---
name: Real-Time Communication
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: []
---

## Description

Socket.IO handles all real-time bidirectional communication. Built-in room support maps directly to game rooms.

## Requirements

### Transport
- Socket.IO for V1
- Event-based, bidirectional
- Built-in room support

### Event Rules
- All events use strict payload schemas
- Backend validates every payload
- Malformed payloads rejected
- Unauthorized actions rejected
- All processing against in-memory state only

### Client → Server Events
- `create_room`, `join_room`, `leave_room`, `reconnect_session`
- `start_game`, `stop_game`, `transfer_admin`, `kick_player`
- `add_offline_player`, `remove_offline_player`, `add_word`
- `submit_vote`, `advance_phase`

### Server → Client Events
- `room_created`, `room_joined`, `room_state_updated`, `player_list_updated`
- `admin_changed`, `game_started`, `phase_changed`, `role_assigned`
- `vote_state_updated`, `round_result`, `game_stopped`, `word_added`
- `action_rejected`, `session_recovered`, `player_disconnected`, `player_reconnected`

### Broadcast Strategy
- Full snapshot on join/reconnect only
- Delta updates for routine changes
- Sensitive events (role_assigned) sent privately, never broadcast

## Related Files

- `backend/src/socket/registerSocketHandlers.ts`
- `backend/src/socket/events.ts`
- `backend/src/validators/eventValidators.ts`
- `frontend/src/lib/socket.ts`
- `frontend/src/hooks/useSocketEvents.ts`

## Notes

- Express optional, only for health endpoint if needed
