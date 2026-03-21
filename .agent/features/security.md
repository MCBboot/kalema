---
name: Security & Validation
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [realtime]
---

## Description

Server-authoritative model. Backend is sole source of truth. Frontend is never trusted for anything important.

## Requirements

### Server Authority
Backend controls:
- Room membership
- Admin privilege
- Word selection
- Impostor selection
- Vote validity
- Phase transitions
- Game result

### Role Secrecy
- Secret word sent ONLY to non-impostor online players
- Impostor status sent ONLY to the impostor
- Never broadcast role data to entire room
- Offline players: admin sees roles (unavoidable trust compromise)

### Validation Checklist
Backend must validate:
- Room existence
- Player belongs to room
- Player is admin (when required)
- Current phase allows action
- Target player exists
- Vote target is valid
- Word format is valid
- Duplicate names rejected
- Payload schema correct

### Structured Errors
Return errors for: invalid room code, duplicate name, unauthorized action, invalid phase transition, word validation failure, insufficient players, no words, invalid reconnect token, invalid vote target.

## Related Files

- `backend/src/validators/roomValidators.ts`
- `backend/src/validators/playerValidators.ts`
- `backend/src/validators/eventValidators.ts`

## Notes

- Input validation at every socket event handler entry point
