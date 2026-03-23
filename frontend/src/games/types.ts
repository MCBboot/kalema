import type { ComponentType, ReactNode } from "react";

export interface GameComponentProps {
  room: {
    id: string;
    code: string;
    status: string;
    adminPlayerId: string;
    players: Array<{
      id: string;
      displayName: string;
      type: string;
      isAdmin: boolean;
      isConnected: boolean;
    }>;
    selectedGame: string | null;
    gameState: unknown;
  };
  myPlayerId: string;
  isAdmin: boolean;
}

export interface LobbyConfigProps {
  room: GameComponentProps["room"];
  isAdmin: boolean;
}

export interface GameRegistration {
  id: string;
  nameKey: string;
  descriptionKey: string;
  minPlayers: number;
  maxPlayers: number;
  icon: ReactNode;
  GameComponent: ComponentType<GameComponentProps>;
  LobbyConfig?: ComponentType<LobbyConfigProps>;
}
