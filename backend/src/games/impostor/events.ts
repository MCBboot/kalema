// Impostor game-specific socket events (client → server)
export const IMPOSTOR_SET_ADMIN_MODE = "impostor:set_admin_mode" as const;
export const IMPOSTOR_START_ROUND = "impostor:start_round" as const;
export const IMPOSTOR_ADVANCE_PHASE = "impostor:advance_phase" as const;
export const IMPOSTOR_SUBMIT_VOTE = "impostor:submit_vote" as const;
export const IMPOSTOR_ADD_WORD = "impostor:add_word" as const;
export const IMPOSTOR_MARK_TURN_DONE = "impostor:mark_turn_done" as const;
export const IMPOSTOR_REQUEST_VOTE = "impostor:request_vote" as const;
export const IMPOSTOR_RESTART_FREE_ROUND = "impostor:restart_free_round" as const;

// Impostor game-specific socket events (server → client)
export const IMPOSTOR_ROLE_ASSIGNED = "impostor:role_assigned" as const;
export const IMPOSTOR_PHASE_CHANGED = "impostor:phase_changed" as const;
export const IMPOSTOR_VOTE_STATE_UPDATED = "impostor:vote_state_updated" as const;
export const IMPOSTOR_ROUND_RESULT = "impostor:round_result" as const;
export const IMPOSTOR_WORD_ADDED = "impostor:word_added" as const;
export const IMPOSTOR_TURN_UPDATED = "impostor:turn_updated" as const;
export const IMPOSTOR_VOTE_REQUESTS_UPDATED = "impostor:vote_requests_updated" as const;

export const IMPOSTOR_CLIENT_EVENTS = [
  IMPOSTOR_SET_ADMIN_MODE,
  IMPOSTOR_START_ROUND,
  IMPOSTOR_ADVANCE_PHASE,
  IMPOSTOR_SUBMIT_VOTE,
  IMPOSTOR_ADD_WORD,
  IMPOSTOR_MARK_TURN_DONE,
  IMPOSTOR_REQUEST_VOTE,
  IMPOSTOR_RESTART_FREE_ROUND,
] as const;
