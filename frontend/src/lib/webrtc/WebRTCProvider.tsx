"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { p2pManager } from "./WebRTCManager";
import { Room, Player } from "@kalema/shared";
import { useSocketEvent } from "@/hooks/useSocketEvents";

interface WebRTCState {
  mode: "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT";
  setMode: (mode: "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT", playerId: string) => void;
  sendEvent: (eventName: string, payload: any) => void;
  initiateConnection: (targetPlayerId: string) => void;
}

const WebRTCContext = createContext<WebRTCState | null>(null);

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<"ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT">("ONLINE");

  // Expose methods for the app to interact with the connection manager
  const setMode = (newMode: "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT", playerId: string) => {
    setModeState(newMode);
    p2pManager.setMode(newMode, playerId);
  };

  const sendEvent = (eventName: string, payload: any) => {
    p2pManager.sendEvent(eventName, payload);
  };

  const initiateConnection = (targetPlayerId: string) => {
    p2pManager.initiateConnectionTo(targetPlayerId);
  };

  // Listen to WebRTC signaling events from the Socket.IO server
  useSocketEvent("webrtc_offer", (payload: any) => p2pManager.handleSignalingData("webrtc_offer", payload));
  useSocketEvent("webrtc_answer", (payload: any) => p2pManager.handleSignalingData("webrtc_answer", payload));
  useSocketEvent("webrtc_ice_candidate", (payload: any) => p2pManager.handleSignalingData("webrtc_ice_candidate", payload));

  return (
    <WebRTCContext.Provider value={{ mode, setMode, sendEvent, initiateConnection }}>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC(): WebRTCState {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("useWebRTC must be used within WebRTCProvider");
  return ctx;
}
