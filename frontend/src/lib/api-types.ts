// Enums
export type RoomStatus = "WAITING" | "LOCKED" | "PLAYING";
export type PlayerType = "ONLINE" | "OFFLINE";

// Impostor-specific admin mode (game-level, not room-level)
export type AdminMode = "ADMIN_ONLY" | "ADMIN_PLAYER";

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

export interface Room {
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  status: RoomStatus;
  adminPlayerId: string;
  players: Player[];
  selectedGame: string | null;
  gameState: unknown;
}

// Core event names
export const ClientEvents = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  RECONNECT_SESSION: "reconnect_session",
  TRANSFER_ADMIN: "transfer_admin",
  KICK_PLAYER: "kick_player",
  ADD_OFFLINE_PLAYER: "add_offline_player",
  REMOVE_OFFLINE_PLAYER: "remove_offline_player",
  LOCK_ROOM: "lock_room",
  UNLOCK_ROOM: "unlock_room",
  SELECT_GAME: "select_game",
  START_GAME: "start_game",
  STOP_GAME: "stop_game",
} as const;

export const ServerEvents = {
  ROOM_CREATED: "room_created",
  ROOM_JOINED: "room_joined",
  ROOM_STATE_UPDATED: "room_state_updated",
  PLAYER_LIST_UPDATED: "player_list_updated",
  ADMIN_CHANGED: "admin_changed",
  GAME_SELECTED: "game_selected",
  GAME_STARTED: "game_started",
  GAME_STOPPED: "game_stopped",
  GAME_STATE_UPDATED: "game_state_updated",
  GAME_PLAYER_DATA: "game_player_data",
  ACTION_REJECTED: "action_rejected",
  SESSION_RECOVERED: "session_recovered",
  PLAYER_DISCONNECTED: "player_disconnected",
  PLAYER_RECONNECTED: "player_reconnected",
} as const;

// Impostor game events (namespaced)
export const ImpostorEvents = {
  SET_ADMIN_MODE: "impostor:set_admin_mode",
  START_ROUND: "impostor:start_round",
  ADVANCE_PHASE: "impostor:advance_phase",
  SUBMIT_VOTE: "impostor:submit_vote",
  ADD_WORD: "impostor:add_word",
  MARK_TURN_DONE: "impostor:mark_turn_done",
  REQUEST_VOTE: "impostor:request_vote",
  RESTART_FREE_ROUND: "impostor:restart_free_round",
  ROLE_ASSIGNED: "impostor:role_assigned",
  PHASE_CHANGED: "impostor:phase_changed",
  VOTE_STATE_UPDATED: "impostor:vote_state_updated",
  ROUND_RESULT: "impostor:round_result",
  WORD_ADDED: "impostor:word_added",
  TURN_UPDATED: "impostor:turn_updated",
  VOTE_REQUESTS_UPDATED: "impostor:vote_requests_updated",
} as const;

// Event payload types
export interface CreateRoomPayload {
  displayName: string;
}

export interface JoinRoomPayload {
  code: string;
  displayName: string;
}

export interface SelectGamePayload {
  gameId: string;
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

export interface StartGamePayload {
  config?: unknown;
}

export interface SubmitVotePayload {
  targetPlayerId: string;
  offlinePlayerId?: string;
}

export interface ReconnectSessionPayload {
  token: string;
}

export interface ActionRejectedPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Impostor-specific types
export interface ImpostorRoleAssignedPayload {
  role: "impostor" | "normal";
  word?: string;
}

export interface ImpostorVoteStatePayload {
  totalEligible: number;
  votedCount: number;
}

export interface ImpostorRoundResultPayload {
  impostorId: string;
  impostorName: string;
  word: string;
  impostorCaught: boolean;
  voteTally: Record<string, number>;
}

export interface ImpostorPhaseChangedPayload {
  phase: "CHOOSING" | "ROLE_REVEAL" | "STRUCTURED_ROUND" | "FREE_ROUND" | "VOTING" | "RESULT";
  restarted?: boolean;
}

export interface ImpostorTurnUpdatedPayload {
  turnOrder: string[];
  currentTurnIndex: number;
  askedPlayerIds: string[];
  allTurnsDone: boolean;
  currentAskerId: string | null;
  currentAnswererId: string | null;
}

export interface ImpostorVoteRequestsPayload {
  playerIds: string[];
}

export interface ImpostorGameState {
  gameId: "impostor";
  phase: "CHOOSING" | "ROLE_REVEAL" | "STRUCTURED_ROUND" | "FREE_ROUND" | "VOTING" | "RESULT";
  adminMode: AdminMode;
  words: string[];
  currentRound: {
    id: string;
    phase: string;
    votes: Array<{ voterPlayerId: string; targetPlayerId: string; submittedAt: number }>;
    startedAt: number;
    turnOrder: string[];
    currentTurnIndex: number;
    askedPlayerIds: string[];
    voteRequestPlayerIds: string[];
  } | null;
}
