---
name: Test Cases
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: []
---

## Description

Comprehensive test cases covering all backend services (unit tests with Vitest), socket integration tests, and frontend component tests. Tests are written alongside each phase of implementation.

## Test Framework

- **Backend unit tests:** Vitest
- **Backend integration tests:** Vitest + socket.io-client (programmatic multi-client)
- **Frontend component tests:** Vitest + React Testing Library
- **E2E smoke tests:** manual checklist (V1), Playwright (future)

## Test Folder Structure

```
backend/
  src/
    __tests__/              # Integration tests (multi-client socket)
      gameLifecycle.test.ts
    services/__tests__/     # Unit tests per service
      roomService.test.ts
      playerService.test.ts
      adminService.test.ts
      wordService.test.ts
      roundService.test.ts
      voteService.test.ts
      reconnectService.test.ts
    validators/__tests__/
      roomValidators.test.ts
      playerValidators.test.ts
      eventValidators.test.ts
    utils/__tests__/
      fileLoader.test.ts
      id.test.ts
      random.test.ts
    jobs/__tests__/
      cleanupJob.test.ts

frontend/
  src/
    components/__tests__/
      shared/
      room/
      admin/
      game/
    store/__tests__/
      roomStore.test.ts
      playerStore.test.ts
      secretStore.test.ts
      connectionStore.test.ts
    hooks/__tests__/
      useSocketEvents.test.ts
      useReconnect.test.ts
```

---

## Backend Unit Tests

### roomService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| R1 | Create room with valid name and ADMIN_PLAYER mode | Room created, creator is admin, status WAITING, words copied from defaults |
| R2 | Create room with valid name and ADMIN_ONLY mode | Room created, adminMode is ADMIN_ONLY |
| R3 | Create room — words list is a copy, not a reference | Mutating room.words does NOT affect defaultWords |
| R4 | Join room with valid code and unique name | Player added, player list grows by 1 |
| R5 | Join room with non-existent code | Rejected: ROOM_NOT_FOUND |
| R6 | Join room with duplicate display name | Rejected: DUPLICATE_NAME |
| R7 | Leave room — non-admin player | Player removed, player list shrinks |
| R8 | Leave room — admin player, other players exist | Admin auto-transfers to longest-tenured connected player |
| R9 | Leave room — last player | Room deleted from store |
| R10 | getRoomByCode returns correct room | Room found by code |
| R11 | getRoomByCode with invalid code | Returns undefined |

### playerService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| P1 | Add online player with valid name | Player created, type ONLINE, isConnected true, socketId set |
| P2 | Add online player with empty name | Rejected: INVALID_NAME |
| P3 | Add online player with whitespace-only name | Rejected: INVALID_NAME |
| P4 | Add online player with name exceeding max length | Rejected: NAME_TOO_LONG |
| P5 | Add online player with duplicate name in room | Rejected: DUPLICATE_NAME |
| P6 | Remove player from room | Player removed from players array |
| P7 | Remove non-existent player | Rejected: PLAYER_NOT_FOUND |
| P8 | Mark player as disconnected | isConnected = false, socketId = null |
| P9 | Mark player as reconnected with new socketId | isConnected = true, socketId updated |
| P10 | Find player by socketId | Returns correct player |
| P11 | Find player by non-existent socketId | Returns undefined |

### adminService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| A1 | Transfer admin to valid target | Target becomes admin, old admin loses admin |
| A2 | Transfer admin — non-admin attempts | Rejected: UNAUTHORIZED |
| A3 | Transfer admin to non-existent player | Rejected: PLAYER_NOT_FOUND |
| A4 | Transfer admin to self | Rejected: INVALID_TARGET |
| A5 | Kick online player | Player removed, socket disconnected |
| A6 | Kick offline player | Player removed from room |
| A7 | Kick — non-admin attempts | Rejected: UNAUTHORIZED |
| A8 | Kick admin (self) | Rejected: CANNOT_KICK_ADMIN |
| A9 | Kick non-existent player | Rejected: PLAYER_NOT_FOUND |
| A10 | Add offline player with valid unique name | Offline player added, type OFFLINE, socketId null |
| A11 | Add offline player with duplicate name | Rejected: DUPLICATE_NAME |
| A12 | Add offline player — non-admin attempts | Rejected: UNAUTHORIZED |
| A13 | Remove offline player | Player removed |
| A14 | Remove online player via removeOfflinePlayer | Rejected: PLAYER_NOT_OFFLINE |
| A15 | Auto-transfer admin on admin disconnect | Admin transferred to longest-tenured connected player |
| A16 | Auto-transfer admin — no eligible players | Room enters zombie state (cleaned up later) |

### wordService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| W1 | Load default words from valid file | Array of trimmed, non-empty, deduplicated words |
| W2 | Load file with blank lines and whitespace | Blank lines ignored, whitespace trimmed |
| W3 | Load file with duplicate words | Duplicates removed |
| W4 | Load from non-existent file | Throws error (fail startup) |
| W5 | Load from empty file | Throws error (no words) |
| W6 | getDefaultWords returns a copy | Mutating result doesn't affect source |
| W7 | Add valid word to room | Word appended to room.words |
| W8 | Add empty word | Rejected: INVALID_WORD |
| W9 | Add whitespace-only word | Rejected: INVALID_WORD |
| W10 | Add duplicate word (already in room) | Rejected: DUPLICATE_WORD |
| W11 | Add word — non-admin attempts | Rejected: UNAUTHORIZED |
| W12 | Added word exists only in that room | Other rooms unaffected |

### roundService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| G1 | Start round — valid conditions (WAITING, enough players, words exist) | Round created, impostor selected, word selected, status → ROLE_REVEAL |
| G2 | Start round — room not in WAITING | Rejected: INVALID_PHASE |
| G3 | Start round — fewer than minimum players | Rejected: INSUFFICIENT_PLAYERS |
| G4 | Start round — zero words | Rejected: NO_WORDS |
| G5 | Start round — ADMIN_ONLY mode | Admin excluded from eligible participants |
| G6 | Start round — ADMIN_PLAYER mode | Admin included in eligible participants |
| G7 | Start round — offline players included in participants | Offline players are eligible |
| G8 | Start round — exactly one impostor selected | Only one player has impostor role |
| G9 | Start round — all non-impostors get the same word | Word matches round.word |
| G10 | Advance phase: ROLE_REVEAL → DISCUSSION | Valid, phase updated |
| G11 | Advance phase: DISCUSSION → VOTING | Valid, phase updated |
| G12 | Advance phase: VOTING → RESULT | Valid, phase updated |
| G13 | Advance phase: RESULT → WAITING | Valid, round cleared, status reset |
| G14 | Advance phase: WAITING → anything (no round) | Rejected: INVALID_PHASE |
| G15 | Advance phase: skip phases (ROLE_REVEAL → VOTING) | Rejected: INVALID_PHASE_TRANSITION |
| G16 | Stop game from ROLE_REVEAL | Status → WAITING, round cleared |
| G17 | Stop game from DISCUSSION | Status → WAITING, round cleared |
| G18 | Stop game from VOTING | Status → WAITING, round cleared |
| G19 | Stop game from RESULT | Status → WAITING, round cleared |
| G20 | Stop game from WAITING (no active game) | Rejected: NO_ACTIVE_GAME |
| G21 | Stop game — non-admin attempts | Rejected: UNAUTHORIZED |
| G22 | getEligibleParticipants — excludes disconnected online players | Only connected players eligible |
| G23 | Start round — random word selected from room.words | Word is one of the room's words |
| G24 | Start round — random impostor from eligible participants | Impostor is one of the eligible players |

### voteService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| V1 | Submit valid vote in VOTING phase | Vote recorded, vote count increments |
| V2 | Submit vote outside VOTING phase | Rejected: INVALID_PHASE |
| V3 | Submit duplicate vote (same voter) | Rejected: ALREADY_VOTED |
| V4 | Submit vote for non-existent target | Rejected: INVALID_TARGET |
| V5 | Submit vote for self | Rejected: CANNOT_VOTE_SELF |
| V6 | Submit vote — voter not an eligible participant | Rejected: NOT_ELIGIBLE |
| V7 | Submit offline player vote via admin | Vote recorded for offline player |
| V8 | Submit offline vote — non-admin attempts | Rejected: UNAUTHORIZED |
| V9 | Check all voted — not all voted yet | Returns false |
| V10 | Check all voted — all eligible participants voted | Returns true |
| V11 | Calculate result — impostor has most votes | impostorCaught = true |
| V12 | Calculate result — impostor does NOT have most votes | impostorCaught = false |
| V13 | Calculate result — tie (impostor tied with someone) | impostorCaught = false (tie rule) |
| V14 | Calculate result — no votes cast | impostorCaught = false |
| V15 | Calculate result — returns correct vote tally | Each target's vote count is correct |
| V16 | Calculate result — reveals impostor identity and word | Result includes impostorId, word |

### reconnectService.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| RC1 | Create reconnect session | Token generated, stored in map, expiry set |
| RC2 | Recover session with valid token | Player rebound, session returned |
| RC3 | Recover session with expired token | Rejected: TOKEN_EXPIRED |
| RC4 | Recover session with invalid token | Rejected: INVALID_TOKEN |
| RC5 | Recover session — room no longer exists | Rejected: ROOM_NOT_FOUND |
| RC6 | Recover session — player no longer in room | Rejected: PLAYER_NOT_FOUND |
| RC7 | Clean expired tokens | Expired tokens removed, valid tokens remain |
| RC8 | Create new token replaces old one for same player | Only latest token valid |

### Validators

#### roomValidators.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| RV1 | Valid create room payload | Passes validation |
| RV2 | Missing displayName | Fails: MISSING_FIELD |
| RV3 | Missing adminMode | Fails: MISSING_FIELD |
| RV4 | Invalid adminMode value | Fails: INVALID_VALUE |
| RV5 | Valid join room payload | Passes validation |
| RV6 | Missing room code | Fails: MISSING_FIELD |

#### playerValidators.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| PV1 | Valid display name | Passes |
| PV2 | Empty string | Fails |
| PV3 | Whitespace only | Fails |
| PV4 | Exceeds max length | Fails |
| PV5 | Duplicate in existing names | Fails |
| PV6 | Arabic name with valid length | Passes |

### Utils

#### fileLoader.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| FL1 | Load valid UTF-8 file | Returns array of strings |
| FL2 | Lines are trimmed | No leading/trailing whitespace |
| FL3 | Blank lines removed | No empty strings in result |
| FL4 | File not found | Throws error |
| FL5 | Arabic content preserved | Arabic strings intact |

#### id.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| ID1 | generateId returns unique values | 100 calls produce 100 unique IDs |
| ID2 | generateRoomCode returns correct length | Length matches ROOM_CODE_LENGTH |
| ID3 | generateRoomCode is alphanumeric | Matches /^[A-Z0-9]+$/ |
| ID4 | generateRoomCode produces unique values | 100 calls produce mostly unique codes |

#### random.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| RN1 | pickRandom returns element from array | Result is in source array |
| RN2 | pickRandom with single element | Returns that element |
| RN3 | pickRandom with empty array | Throws error |

### cleanupJob.test.ts

| # | Test Case | Expected |
|---|-----------|----------|
| CL1 | Cleanup removes expired reconnect tokens | Expired tokens gone, valid tokens remain |
| CL2 | Cleanup removes inactive empty rooms | Room with no connected players + expired timeout deleted |
| CL3 | Cleanup keeps active rooms | Room with connected players untouched |
| CL4 | Cleanup keeps recently active empty rooms | Room within timeout window untouched |

---

## Backend Integration Tests (Socket)

### gameLifecycle.test.ts

Full lifecycle tests using programmatic Socket.IO clients.

| # | Test Case | Expected |
|---|-----------|----------|
| INT1 | Create room → receive room_created with room state | Room code, admin, WAITING status |
| INT2 | Join room → creator receives player_list_updated, joiner receives room_joined | Both see 2 players |
| INT3 | 3 players join → start game → all receive game_started | Phase is ROLE_REVEAL |
| INT4 | After start → each online player receives private role_assigned | Exactly 1 impostor, others get word |
| INT5 | Impostor's role_assigned has NO word | `{ role: 'impostor' }` only |
| INT6 | Normal player's role_assigned HAS word | `{ role: 'normal', word: '...' }` |
| INT7 | Advance through all phases → phase_changed received | Correct phase sequence |
| INT8 | All players vote → auto-advance to RESULT → round_result broadcast | Result contains impostor, word, tally |
| INT9 | Admin kicks player → kicked player receives disconnect | Kicked player removed from room |
| INT10 | Admin transfers admin → admin_changed broadcast | New admin confirmed |
| INT11 | Player disconnects → player_disconnected broadcast | Player marked disconnected |
| INT12 | Player reconnects with valid token → session_recovered | Player restored, room state received |
| INT13 | Player reconnects with expired token → action_rejected | TOKEN_EXPIRED error |
| INT14 | Add offline player → player_list_updated broadcast | Offline player in list |
| INT15 | Add word → word_added broadcast | Word count incremented |
| INT16 | Non-admin tries admin action → action_rejected | UNAUTHORIZED error |
| INT17 | Join with duplicate name → action_rejected | DUPLICATE_NAME error |
| INT18 | Start game with 1 player → action_rejected | INSUFFICIENT_PLAYERS |
| INT19 | 50 players join room → all receive updates | No errors, all players in list |
| INT20 | Full game cycle: create → join 4 → start → reveal → discuss → vote → result → new round | Complete lifecycle works |

---

## Frontend Component Tests

### Shared Components

| # | Component | Test Case | Expected |
|---|-----------|-----------|----------|
| FC1 | Button | Renders with Arabic text | Text visible, RTL aligned |
| FC2 | Button | Disabled state | Cannot click, styled as disabled |
| FC3 | Button | Loading state | Shows loading indicator |
| FC4 | Input | RTL text input | Text direction is RTL |
| FC5 | Input | Shows validation error in Arabic | Error message displayed |
| FC6 | ErrorMessage | Maps error code to Arabic string | Correct Arabic message shown |
| FC7 | ErrorMessage | Unknown error code | Shows generic Arabic error |

### Room Components

| # | Component | Test Case | Expected |
|---|-----------|-----------|----------|
| FC8 | PlayerList | Renders list of players | All player names visible |
| FC9 | PlayerList | Shows admin badge on admin | Badge visible next to admin |
| FC10 | PlayerList | Groups online and offline players | Two groups rendered |
| FC11 | PlayerList | Shows disconnected indicator | Disconnected player styled differently |
| FC12 | PlayerList | 50+ players renders without crash | List renders, scrollable |
| FC13 | RoomCode | Displays room code | Code visible in large text |
| FC14 | RoomCode | Copy button copies to clipboard | Clipboard API called |

### Admin Components

| # | Component | Test Case | Expected |
|---|-----------|-----------|----------|
| FC15 | AdminPanel | Only renders when user is admin | Hidden for non-admin |
| FC16 | PlayerManagement | Kick button triggers kick event | Socket emit called |
| FC17 | PlayerManagement | Transfer button triggers transfer event | Socket emit called |
| FC18 | PlayerManagement | Add offline player form submits | Socket emit called with name |
| FC19 | WordPanel | Add word submits via socket | Socket emit called with word |
| FC20 | WordPanel | Shows word count | Count matches room.words.length |

### Game Components

| # | Component | Test Case | Expected |
|---|-----------|-----------|----------|
| FC21 | RoleReveal | Normal player sees word | Word displayed in Arabic |
| FC22 | RoleReveal | Impostor sees impostor message | "!انت المحتال" displayed |
| FC23 | VotingScreen | Renders vote targets (excludes self) | Self not in target list |
| FC24 | VotingScreen | Submitting vote emits event | Socket emit called |
| FC25 | VotingScreen | After voting, shows waiting state | "waiting for others" shown |
| FC26 | VoteProgress | Shows X/Y progress | Correct count displayed |
| FC27 | ResultScreen | Shows impostor identity | Impostor name displayed |
| FC28 | ResultScreen | Shows secret word | Word displayed |
| FC29 | ResultScreen | Shows vote breakdown | Vote tally visible |
| FC30 | GameControls | Start button only in WAITING | Button rendered only in WAITING |
| FC31 | GameControls | Stop button in active phases | Button rendered in active phases |
| FC32 | PhaseIndicator | Highlights current phase | Active phase visually distinct |

### Store Tests

| # | Store | Test Case | Expected |
|---|-------|-----------|----------|
| FS1 | roomStore | setRoom stores room data | room matches set data |
| FS2 | roomStore | clearRoom resets to null | room is null |
| FS3 | roomStore | updatePlayers updates player list | players array updated |
| FS4 | playerStore | setMyPlayer stores player ID | myPlayerId set |
| FS5 | secretStore | setMyRole stores role info | role and word set |
| FS6 | secretStore | clearRole resets to null | role and word null |
| FS7 | connectionStore | tracks connection state | isConnected toggles correctly |

---

## E2E Smoke Test Checklist (Manual — V1)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| E1 | Create room | Open app → enter name → create room | Room created, code shown, in lobby |
| E2 | Join room | Open app → enter name + code → join | In lobby, see all players |
| E3 | Admin kicks player | Admin clicks kick on player | Player disconnected, removed from list |
| E4 | Admin transfers admin | Admin clicks transfer on player | New admin has controls |
| E5 | Add offline player | Admin enters name, adds | Offline player appears in list |
| E6 | Add word | Admin enters word, adds | Word count increases |
| E7 | Start game (3+ players) | Admin clicks start | All players see roles privately |
| E8 | Role secrecy | Check network tab | role_assigned only sent to individual player |
| E9 | Phase flow | Admin advances phases | Screens change for all players |
| E10 | Voting | Each player votes | Progress updates, auto-advances to result |
| E11 | Offline voting | Admin submits vote for offline player | Vote counted |
| E12 | Result screen | After all votes | Shows impostor, word, tally |
| E13 | Reconnect | Close tab, reopen within 5min | Session restored, game state intact |
| E14 | Reconnect expired | Wait 10min, try reconnect | Error: session expired |
| E15 | 25+ players | Join 25+ tabs | All players visible, UI usable |
| E16 | Arabic RTL | Check all screens | All text Arabic, layout RTL |
| E17 | Mobile viewport | Open on mobile | Responsive, usable |
| E18 | Duplicate name | Try joining with existing name | Error shown in Arabic |
| E19 | New round | After result, start new game | New roles assigned, new word |
| E20 | Stop mid-game | Admin stops during discussion | Everyone returns to lobby |

---

## Notes

- Backend unit tests should run without a real server (mock memoryStore or use fresh instances)
- Integration tests spin up a real Socket.IO server on a random port, connect programmatic clients
- Frontend component tests mock the socket connection
- All test files co-located with source using `__tests__/` directories
- Tests written alongside each implementation phase (not deferred to the end)
