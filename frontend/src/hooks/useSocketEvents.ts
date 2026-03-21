"use client";
import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocketEvent<T = unknown>(
  eventName: string,
  callback: (data: T) => void
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: T) => savedCallback.current(data);
    socket.on(eventName, handler as Parameters<Socket["on"]>[1]);
    return () => {
      socket.off(eventName, handler as Parameters<Socket["off"]>[1]);
    };
  }, [eventName]);
}

export function useSocketEmit() {
  const socketRef = useRef<Socket>(getSocket());

  return function emit<T = unknown>(eventName: string, data?: T) {
    socketRef.current.emit(eventName, data);
  };
}
