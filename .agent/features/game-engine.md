---
name: Game Engine
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [rooms, players, admin, words]
---

## Description

Core game logic: starting rounds, assigning roles (impostor + normal), managing phase transitions, computing results.

## Requirements

### Start Game (admin only)
Conditions:
- Room exists, status is WAITING
- Minimum playable participants reached
- At least one word in room
- No active round

Steps:
1. Build eligible participants (exclude admin if ADMIN_ONLY, include offline)
2. Choose random word from room word list
3. Choose random impostor from eligible participants
4. Create round object
5. Send private role events to online players
6. Transition to ROLE_REVEAL

### Phase State Machine
```
WAITING → ROLE_REVEAL → DISCUSSION → VOTING → RESULT → WAITING
Any active phase → STOPPED (admin override)
```
Illegal transitions must be rejected.

### Role Assignment
- One impostor per round
- All non-impostors get the same word
- Impostor gets impostor status only (no word)
- Online players receive private socket events
- Offline players: admin mediates via UI

### Round Data Model
```ts
interface Round {
  id: string;
  word: string;
  impostorPlayerId: string;
  phase: "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";
  votes: Vote[];
  startedAt: number;
}
```

### Stop Game
- Admin can stop from any active phase
- Clears round state, returns room to WAITING/STOPPED

## Related Files

- `backend/src/models/round.ts`
- `backend/src/services/roundService.ts`
- `frontend/src/components/game/` (role reveal, discussion, result screens)

## Notes

- Role secrecy is critical — never broadcast roles to entire room
