import { Room, RoomStatus } from "../index.js";
import { Player } from "../index.js";

// ── Client-to-Server Event Names (Core) ──

export const CREATE_ROOM = "create_room" as const;
export const JOIN_ROOM = "join_room" as const;
export const LEAVE_ROOM = "leave_room" as const;
export const RECONNECT_SESSION = "reconnect_session" as const;
export const TRANSFER_ADMIN = "transfer_admin" as const;
export const KICK_PLAYER = "kick_player" as const;
export const ADD_OFFLINE_PLAYER = "add_offline_player" as const;
export const REMOVE_OFFLINE_PLAYER = "remove_offline_player" as const;
export const LOCK_ROOM = "lock_room" as const;
export const UNLOCK_ROOM = "unlock_room" as const;
export const SELECT_GAME = "select_game" as const;
export const START_GAME = "start_game" as const;
export const STOP_GAME = "stop_game" as const;

// ── Server-to-Client Event Names (Core) ──

export const ROOM_CREATED = "room_created" as const;
export const ROOM_JOINED = "room_joined" as const;
export const ROOM_STATE_UPDATED = "room_state_updated" as const;
export const PLAYER_LIST_UPDATED = "player_list_updated" as const;
export const ADMIN_CHANGED = "admin_changed" as const;
export const GAME_SELECTED = "game_selected" as const;
export const GAME_STARTED = "game_started" as const;
export const GAME_STOPPED = "game_stopped" as const;
export const GAME_STATE_UPDATED = "game_state_updated" as const;
export const GAME_PLAYER_DATA = "game_player_data" as const;
export const ACTION_REJECTED = "action_rejected" as const;
export const SESSION_RECOVERED = "session_recovered" as const;
export const PLAYER_DISCONNECTED = "player_disconnected" as const;
export const PLAYER_RECONNECTED = "player_reconnected" as const;

// ── Client-to-Server Payloads ──

export interface CreateRoomRequest {
  displayName: string;
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

export interface SelectGameRequest {
  gameId: string;
}

export interface StartGameRequest {
  config?: unknown;
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

export interface GameSelectedPayload {
  gameId: string;
}

export interface GameStartedPayload {
  roomStatus: RoomStatus;
  gameState: unknown;
}

export interface GameStoppedPayload {
  reason: string;
}

export interface GameStateUpdatedPayload {
  gameState: unknown;
}

export interface GamePlayerDataPayload {
  data: unknown;
}

export interface ActionRejectedPayload {
  event?: string;
  code: string;
  message: string;
}

export interface SessionRecoveredPayload {
  room: Room;
  playerId: string;
  reconnectToken: string;
  gamePlayerData?: unknown;
}

export interface PlayerDisconnectedPayload {
  playerId: string;
}

export interface PlayerReconnectedPayload {
  playerId: string;
}

// ── WebRTC Signaling Events ──

export const WEBRTC_OFFER = "webrtc_offer" as const;
export const WEBRTC_ANSWER = "webrtc_answer" as const;
export const WEBRTC_ICE_CANDIDATE = "webrtc_ice_candidate" as const;

export interface WebRTCOfferPayload {
  targetPlayerId: string;
  offer: unknown;
}

export interface WebRTCAnswerPayload {
  targetPlayerId: string;
  answer: unknown;
}

export interface WebRTCICECandidatePayload {
  targetPlayerId: string;
  candidate: unknown;
}

export interface WebRTCSignalRelayPayload {
  sourcePlayerId: string;
  payload: unknown;
}
