# Feature: Real-Time Communication

> **Status:** implemented | **Priority:** high | **Updated:** 2026-03-23

## Overview

All communication uses Socket.IO. Events split into **core** (room management) and **game** (namespaced per plugin, e.g., `impostor:*`).

## Event Dispatching

The `gameDispatcher.ts` routes game-prefixed events to the correct plugin by validating `room.selectedGame` matches and calling `game.handleEvent()`.

## Core Events

Client→Server: `create_room`, `join_room`, `leave_room`, `reconnect_session`, `lock_room`, `unlock_room`, `select_game`, `start_game`, `stop_game`, `transfer_admin`, `kick_player`, `add_offline_player`, `remove_offline_player`

Server→Client: `room_created`, `room_joined`, `room_state_updated`, `player_list_updated`, `admin_changed`, `game_selected`, `game_started`, `game_stopped`, `game_state_updated`, `game_player_data`, `action_rejected`, `session_recovered`, `player_disconnected`, `player_reconnected`

## Files

- `backend/src/socket/registerSocketHandlers.ts`
- `backend/src/socket/gameDispatcher.ts`
- `backend/src/socket/events.ts`
- `frontend/src/lib/api-types.ts`
