---
name: Word Management
status: planned
priority: high
created: 2026-03-21
updated: 2026-03-21
owner: unassigned
depends_on: [rooms, admin]
---

## Description

Default words loaded from a `.txt` file at startup. Each room gets its own copy. Admin can add new words at runtime but cannot edit or delete.

## Requirements

### Default Words File
- Path: `backend/src/data/default-words.txt` or `backend/data/default-words.txt`
- Format: UTF-8, one word per line
- Parsing: trim whitespace, ignore blank lines, deduplicate
- If file cannot be loaded: **fail startup with clear error**

### Room Word List
- Each room gets its own copy: `room.words = [...defaultWords]`
- NEVER share array reference between rooms

### Admin Word Rules
- Admin CAN add new words to current room
- Admin CANNOT edit existing words
- Admin CANNOT delete existing words
- Added words affect only that room's in-memory list
- Added words are NOT written back to `.txt` file
- Added words are lost on restart

### Word File Loader
```
Input:    "تفاحة\n\nسيارة\n بحر \n"
Output:   ["تفاحة", "سيارة", "بحر"]
```

## Related Files

- `backend/src/data/default-words.txt`
- `backend/src/services/wordService.ts`
- `backend/src/utils/fileLoader.ts`
- `frontend/src/components/admin/` (word add panel)

## Notes

- Arabic words — ensure UTF-8 encoding throughout
