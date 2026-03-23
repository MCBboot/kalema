"use client";
import { useEffect, useCallback } from "react";

const PERMISSION_KEY = "kalema_notif_requested";

export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (localStorage.getItem(PERMISSION_KEY)) return;

    localStorage.setItem(PERMISSION_KEY, "true");
    Notification.requestPermission();
  }, []);

  const sendPushNotification = useCallback((title: string, body?: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (document.visibilityState !== "hidden") return;
    if (Notification.permission !== "granted") return;

    new Notification(title, { body, icon: "/favicon.ico" });
  }, []);

  return { sendPushNotification };
}
