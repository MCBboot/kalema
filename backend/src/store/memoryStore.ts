import { Room } from "../models/room.js";

export interface SocketSession {
  roomId: string;
  playerId: string;
}

export interface ReconnectSession {
  token: string;
  roomId: string;
  playerId: string;
  expiresAt: number;
}

// ── In-memory stores ──

const rooms = new Map<string, Room>();
const socketToSession = new Map<string, SocketSession>();
const reconnectTokens = new Map<string, ReconnectSession>();

// ── Room helpers ──

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function setRoom(room: Room): void {
  rooms.set(room.id, room);
}

export function deleteRoom(roomId: string): boolean {
  return rooms.delete(roomId);
}

export function getRoomByCode(code: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.code === code) {
      return room;
    }
  }
  return undefined;
}

export function getAllRooms(): Map<string, Room> {
  return rooms;
}

// ── Socket session helpers ──

export function getSessionBySocket(socketId: string): SocketSession | undefined {
  return socketToSession.get(socketId);
}

export function setSession(socketId: string, session: SocketSession): void {
  socketToSession.set(socketId, session);
}

export function deleteSession(socketId: string): boolean {
  return socketToSession.delete(socketId);
}

// ── Reconnect token helpers ──

export function getReconnectToken(token: string): ReconnectSession | undefined {
  return reconnectTokens.get(token);
}

export function setReconnectToken(session: ReconnectSession): void {
  reconnectTokens.set(session.token, session);
}

export function deleteReconnectToken(token: string): boolean {
  return reconnectTokens.delete(token);
}

export function getAllReconnectTokens(): Map<string, ReconnectSession> {
  return reconnectTokens;
}
