# Feature: Word Management

> **Status:** implemented | **Priority:** medium | **Updated:** 2026-03-23

## Overview

Word management is now part of the **Impostor game plugin** (`backend/src/games/impostor/words.ts`).

- Default words loaded from `backend/src/games/impostor/data/default-words.txt`
- Each game instance gets its own copy of the word list
- Words can be added at runtime via `impostor:add_word` event
- No edit or delete — add only
