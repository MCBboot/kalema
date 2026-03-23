# Feature: Impostor Game (المتخفي)

## Overview

The first game plugin. One player is secretly the impostor (doesn't get the word), the group discusses and votes to find them.

## Game Flow

1. Admin starts round → word selected, impostor randomly chosen
2. **CHOOSING**: Admin can add words, start a round
3. **ROLE_REVEAL**: Each player sees their role (impostor sees nothing, others see the word)
4. **DISCUSSION**: Players discuss to find the impostor
5. **VOTING**: Each player votes for who they think is the impostor
6. **RESULT**: Vote tally shown, impostor revealed, caught or escaped

## Backend Plugin

Location: `backend/src/games/impostor/`

- `index.ts` — `GameDefinition` implementation, handles all `impostor:*` events
- `state.ts` — `ImpostorGameState`, `ImpostorRound`, `Vote`, `ImpostorPhase`
- `round.ts` — `startRound()`, `advancePhase()`, `stopRound()`
- `vote.ts` — `submitVote()`, `submitOfflineVote()`, `checkAllVoted()`, `calculateResult()`
- `words.ts` — `loadImpostorWords()`, `getDefaultWords()`, `addWord()`
- `events.ts` — Event name constants
- `data/default-words.txt` — 150 Arabic words

## Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `impostor:start_round` | C→S | Start a new round (admin) |
| `impostor:advance_phase` | C→S | Advance phase (admin) |
| `impostor:submit_vote` | C→S | Submit vote |
| `impostor:add_word` | C→S | Add word to list |
| `impostor:role_assigned` | S→C | Private role + word |
| `impostor:phase_changed` | S→C | Phase transition |
| `impostor:vote_state_updated` | S→C | Vote count progress |
| `impostor:round_result` | S→C | Round outcome |
| `impostor:word_added` | S→C | Word list updated |

## Frontend Plugin

Location: `frontend/src/games/impostor/`

- `components/ImpostorGame.tsx` — Single component handling all phases
- `store/impostorStore.tsx` — Role/word state with localStorage persistence
- `locales/ar.json` + `en.json` — ~30 translation keys each

## Business Rules

- One impostor per round
- All non-impostors get the same word
- Impostor gets no word
- Minimum 3 eligible players to start
- Admin in ADMIN_ONLY mode is excluded from play
- Offline players are eligible participants
- Tie in votes → impostor escapes
- All votes → auto-advance to RESULT
