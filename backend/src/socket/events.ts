import { AdminMode, Room, RoomStatus } from "../models/room.js";
import { Player } from "../models/player.js";
import { Vote } from "../models/vote.js";

// ── Client-to-Server Event Names ──

export const CREATE_ROOM = "create_room" as const;
export const JOIN_ROOM = "join_room" as const;
export const LEAVE_ROOM = "leave_room" as const;
export const RECONNECT_SESSION = "reconnect_session" as const;
export const START_GAME = "start_game" as const;
export const STOP_GAME = "stop_game" as const;
export const TRANSFER_ADMIN = "transfer_admin" as const;
export const KICK_PLAYER = "kick_player" as const;
export const ADD_OFFLINE_PLAYER = "add_offline_player" as const;
export const REMOVE_OFFLINE_PLAYER = "remove_offline_player" as const;
export const ADD_WORD = "add_word" as const;
export const SUBMIT_VOTE = "submit_vote" as const;
export const ADVANCE_PHASE = "advance_phase" as const;

// ── Server-to-Client Event Names ──

export const ROOM_CREATED = "room_created" as const;
export const ROOM_JOINED = "room_joined" as const;
export const ROOM_STATE_UPDATED = "room_state_updated" as const;
export const PLAYER_LIST_UPDATED = "player_list_updated" as const;
export const ADMIN_CHANGED = "admin_changed" as const;
export const GAME_STARTED = "game_started" as const;
export const PHASE_CHANGED = "phase_changed" as const;
export const ROLE_ASSIGNED = "role_assigned" as const;
export const VOTE_STATE_UPDATED = "vote_state_updated" as const;
export const ROUND_RESULT = "round_result" as const;
export const GAME_STOPPED = "game_stopped" as const;
export const WORD_ADDED = "word_added" as const;
export const ACTION_REJECTED = "action_rejected" as const;
export const SESSION_RECOVERED = "session_recovered" as const;
export const PLAYER_DISCONNECTED = "player_disconnected" as const;
export const PLAYER_RECONNECTED = "player_reconnected" as const;

// ── Client-to-Server Payloads ──

export interface CreateRoomRequest {
  displayName: string;
  adminMode: AdminMode;
  words: string[];
}

export interface JoinRoomRequest {
  roomCode: string;
  displayName: string;
}

export interface LeaveRoomRequest {
  roomId: string;
}

export interface ReconnectSessionRequest {
  token: string;
}

export interface StartGameRequest {
  roomId: string;
}

export interface StopGameRequest {
  roomId: string;
}

export interface TransferAdminRequest {
  roomId: string;
  targetPlayerId: string;
}

export interface KickPlayerRequest {
  roomId: string;
  targetPlayerId: string;
}

export interface AddOfflinePlayerRequest {
  roomId: string;
  displayName: string;
}

export interface RemoveOfflinePlayerRequest {
  roomId: string;
  playerId: string;
}

export interface AddWordRequest {
  roomId: string;
  word: string;
}

export interface SubmitVoteRequest {
  roomId: string;
  targetPlayerId: string;
}

export interface AdvancePhaseRequest {
  roomId: string;
}

// ── Server-to-Client Payloads ──

export interface RoomCreatedPayload {
  room: Room;
  playerId: string;
  reconnectToken: string;
}

export interface RoomJoinedPayload {
  room: Room;
  playerId: string;
  reconnectToken: string;
}

export interface RoomStateUpdatedPayload {
  room: Room;
}

export interface PlayerListUpdatedPayload {
  players: Player[];
}

export interface AdminChangedPayload {
  newAdminPlayerId: string;
}

export interface GameStartedPayload {
  roomStatus: RoomStatus;
}

export interface PhaseChangedPayload {
  phase: "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";
}

export interface RoleAssignedPayload {
  role: "IMPOSTOR" | "CITIZEN";
  word: string | null;
}

export interface VoteStateUpdatedPayload {
  votes: Vote[];
  totalExpected: number;
}

export interface RoundResultPayload {
  impostorPlayerId: string;
  impostorCaught: boolean;
  votes: Vote[];
}

export interface GameStoppedPayload {
  reason: string;
}

export interface WordAddedPayload {
  words: string[];
}

export interface ActionRejectedPayload {
  event: string;
  reason: string;
}

export interface SessionRecoveredPayload {
  room: Room;
  playerId: string;
  reconnectToken: string;
}

export interface PlayerDisconnectedPayload {
  playerId: string;
}

export interface PlayerReconnectedPayload {
  playerId: string;
}
