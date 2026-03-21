---
name: Voting System
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [game-engine, players]
---

## Description

Players vote to identify the impostor during the VOTING phase. Offline player votes are submitted through admin UI.

## Requirements

### Vote Rules
- One vote per active participant
- No duplicate vote (unless replacement explicitly allowed)
- Votes only accepted during VOTING phase
- Invalid targets rejected
- Offline player votes submitted through admin

### Vote End Conditions
- All active participants voted, OR
- Voting timer expires (if timer implemented)

### Result Calculation
- Count valid votes per target
- Tie handling: no successful identification (V1 default)
- Reveal: impostor identity, secret word, outcome

### Vote Data Model
```ts
interface Vote {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: number;
}
```

## Related Files

- `backend/src/models/vote.ts`
- `backend/src/services/voteService.ts`
- `frontend/src/components/game/` (voting screen)

## Notes

- Vote progress broadcasts should not reveal who voted for whom until result phase
