export type PlayerType = "ONLINE" | "OFFLINE";

export interface Player {
  id: string;
  displayName: string;
  type: PlayerType;
  isAdmin: boolean;
  isConnected: boolean;
  socketId: string | null;
  joinedAt: number;
}

export function createOnlinePlayer(
  id: string,
  displayName: string,
  socketId: string,
): Player {
  return {
    id,
    displayName,
    type: "ONLINE",
    isAdmin: false,
    isConnected: true,
    socketId,
    joinedAt: Date.now(),
  };
}

export function createOfflinePlayer(id: string, displayName: string): Player {
  return {
    id,
    displayName,
    type: "OFFLINE",
    isAdmin: false,
    isConnected: false,
    socketId: null,
    joinedAt: Date.now(),
  };
}
