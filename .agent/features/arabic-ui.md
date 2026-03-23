# Feature: Internationalization & Arabic UI

> **Status:** implemented | **Priority:** high | **Updated:** 2026-03-23

## Overview

Replaced by the full i18n system supporting Arabic (RTL) + English (LTR).

See `features/i18n.md` for the i18n system details.

## Key Points

- Arabic is the default locale
- All UI text uses `t()` calls from `useTranslation()` hook
- RTL/LTR direction switches automatically with locale
- Error messages mapped from error codes via i18n keys (`error.ROOM_NOT_FOUND`, etc.)
- Font: Noto Sans Arabic
- Theme: Arabian Noir (dark charcoal + amber/gold)
