"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";

interface ConnectionState {
  isConnected: boolean;
  socketId: string | null;
  reconnectToken: string | null;
  isReconnecting: boolean;
  lastDisconnectTime: number | null;
  connect: () => void;
  disconnect: () => void;
  setReconnectToken: (token: string | null) => void;
}

const ConnectionContext = createContext<ConnectionState | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [reconnectToken, setReconnectToken] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastDisconnectTime, setLastDisconnectTime] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
      setSocketId(socket.id ?? null);
      setIsReconnecting(false);
      setLastDisconnectTime(null);
    }

    function onDisconnect() {
      setIsConnected(false);
      setSocketId(null);
      setLastDisconnectTime(Date.now());
    }

    function onReconnectAttempt() {
      setIsReconnecting(true);
    }

    function onReconnectFailed() {
      setIsReconnecting(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
    };
  }, []);

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setIsConnected(false);
    setSocketId(null);
    setReconnectToken(null);
    setIsReconnecting(false);
  }, []);

  const handleSetReconnectToken = useCallback((token: string | null) => {
    setReconnectToken(token);
  }, []);

  const state: ConnectionState = {
    isConnected,
    socketId,
    reconnectToken,
    isReconnecting,
    lastDisconnectTime,
    connect,
    disconnect,
    setReconnectToken: handleSetReconnectToken,
  };

  return (
    <ConnectionContext.Provider value={state}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection(): ConnectionState {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within ConnectionProvider");
  return ctx;
}
