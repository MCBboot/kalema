"use client";
import { useEffect, useRef } from "react";
import { registerImpostorGame } from "@/games/impostor/index";

export function GameInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      registerImpostorGame();
      initialized.current = true;
    }
  }, []);

  return null;
}
