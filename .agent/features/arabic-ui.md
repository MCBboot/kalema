---
name: Arabic RTL UI
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: []
---

## Description

The entire application UI is in Arabic with RTL layout. Technical docs are English, but all user-facing text is Arabic.

## Requirements

### Arabic Text
- All visible UI labels in Arabic
- Arabic system messages
- Arabic error messages
- Arabic-compatible font stack

### RTL Layout
- `dir="rtl"` on root
- Proper alignment for: player lists, controls, dialogs, buttons
- RTL-aware spacing and margins

### Screens (all Arabic)
- Home page
- Create room flow
- Join room flow
- Room lobby
- Admin control panel
- Word add panel
- Offline player control UI
- Role reveal screen
- Discussion screen
- Voting screen
- Result screen
- Reconnect/recovery UI

### Error Mapping
- Backend sends structured error codes
- Frontend maps each code to Arabic user-facing message

### Large Room UI
- Searchable player list for 25+ players
- Grouped display: online vs offline
- Clear admin badge
- Clear kick/transfer controls
- Memoized list rows to avoid full re-render

## Related Files

- `frontend/src/styles/`
- `frontend/src/utils/rtl.ts`
- `frontend/src/utils/formatters.ts`
- All `frontend/src/components/`

## Notes

- Font stack should include Arabic system fonts + a web font fallback
