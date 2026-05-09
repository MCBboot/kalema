import { Room } from "../models/room.js";
import { Player } from "../models/player.js";

export interface GameState {
  gameId: string;
  phase: string;
  data: unknown;
}

export interface GameEventContext {
  room: Room;
  playerId: string;
  // io and socket removed from shared interface to be abstract
  /** Emit to the requesting socket/peer only */
  emit: (event: string, data: unknown) => void;
  /** Broadcast to all sockets/peers in the room */
  broadcast: (event: string, data: unknown) => void;
  /** Emit to a specific socket/peer */
  emitTo: (playerIdOrSocketId: string, event: string, data: unknown) => void;
}

export interface GameDefinition {
  id: string;
  minPlayers: number;
  maxPlayers: number;

  /** Create initial game state when admin starts the game */
  createGameState(room: Room, config?: unknown): GameState;

  /** Handle a game-specific socket event */
  handleEvent(ctx: GameEventContext, eventName: string, payload: unknown): void;

  /** Return public (non-secret) game state for room snapshot */
  getPublicState(state: GameState): unknown;

  /** Return private data for a specific player (e.g., role assignment) */
  getPlayerPrivateData(state: GameState, playerId: string): unknown | null;

  /** Get the list of game-specific event names this game handles */
  getEventNames(): string[];

  /** Get eligible participants for this game */
  getEligibleParticipants(room: Room): Player[];

  /** Called when game is stopped by admin */
  onStop?(state: GameState): void;

  /** Called when a player disconnects during an active game */
  onPlayerDisconnect?(state: GameState, playerId: string): void;
}
