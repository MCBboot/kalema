// Enums
export type RoomStatus = "WAITING" | "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT" | "STOPPED";
export type AdminMode = "ADMIN_ONLY" | "ADMIN_PLAYER";
export type PlayerType = "ONLINE" | "OFFLINE";

// Models
export interface Player {
  id: string;
  displayName: string;
  type: PlayerType;
  isAdmin: boolean;
  isConnected: boolean;
  socketId: string | null;
  joinedAt: number;
}

export interface Vote {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: number;
}

export interface Round {
  id: string;
  word: string;
  impostorPlayerId: string;
  phase: "ROLE_REVEAL" | "DISCUSSION" | "VOTING" | "RESULT";
  votes: Vote[];
  startedAt: number;
}

export interface Room {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  adminPlayerId: string;
  adminMode: AdminMode;
  players: Player[];
  words: string[];
  currentRound: Round | null;
}

// Event names
export const ClientEvents = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  RECONNECT_SESSION: "reconnect_session",
  START_GAME: "start_game",
  STOP_GAME: "stop_game",
  TRANSFER_ADMIN: "transfer_admin",
  KICK_PLAYER: "kick_player",
  ADD_OFFLINE_PLAYER: "add_offline_player",
  REMOVE_OFFLINE_PLAYER: "remove_offline_player",
  ADD_WORD: "add_word",
  SUBMIT_VOTE: "submit_vote",
  ADVANCE_PHASE: "advance_phase",
} as const;

export const ServerEvents = {
  ROOM_CREATED: "room_created",
  ROOM_JOINED: "room_joined",
  ROOM_STATE_UPDATED: "room_state_updated",
  PLAYER_LIST_UPDATED: "player_list_updated",
  ADMIN_CHANGED: "admin_changed",
  GAME_STARTED: "game_started",
  PHASE_CHANGED: "phase_changed",
  ROLE_ASSIGNED: "role_assigned",
  VOTE_STATE_UPDATED: "vote_state_updated",
  ROUND_RESULT: "round_result",
  GAME_STOPPED: "game_stopped",
  WORD_ADDED: "word_added",
  ACTION_REJECTED: "action_rejected",
  SESSION_RECOVERED: "session_recovered",
  PLAYER_DISCONNECTED: "player_disconnected",
  PLAYER_RECONNECTED: "player_reconnected",
} as const;

// Event payload types
export interface CreateRoomPayload {
  displayName: string;
  adminMode: AdminMode;
}

export interface JoinRoomPayload {
  code: string;
  displayName: string;
}

export interface TransferAdminPayload {
  targetPlayerId: string;
}

export interface KickPlayerPayload {
  targetPlayerId: string;
}

export interface AddOfflinePlayerPayload {
  displayName: string;
}

export interface RemoveOfflinePlayerPayload {
  targetPlayerId: string;
}

export interface AddWordPayload {
  word: string;
}

export interface SubmitVotePayload {
  targetPlayerId: string;
}

export interface ReconnectSessionPayload {
  token: string;
}

export interface RoleAssignedPayload {
  role: "impostor" | "normal";
  word?: string;
}

export interface ActionRejectedPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VoteStatePayload {
  totalEligible: number;
  votedCount: number;
}

export interface RoundResultPayload {
  impostorId: string;
  impostorName: string;
  word: string;
  impostorCaught: boolean;
  voteTally: Record<string, number>;
}
