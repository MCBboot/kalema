"use client";
import { useRef } from "react";
import { useToast } from "@/components/shared/Toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSocketEvent } from "@/hooks/useSocketEvents";
import { ERROR_MESSAGES } from "@/components/shared/ErrorMessage";
import {
  ServerEvents,
  ImpostorEvents,
  type Player,
  type ActionRejectedPayload,
} from "@/lib/api-types";

const PHASE_NAMES: Record<string, string> = {
  ROLE_REVEAL: "مرحلة كشف الأدوار",
  STRUCTURED_ROUND: "جولة الأسئلة",
  FREE_ROUND: "نقاش حر",
  VOTING: "مرحلة التصويت",
  RESULT: "النتيجة",
  CHOOSING: "اختيار الكلمة",
};

export function useGameNotifications() {
  const { showToast } = useToast();
  const { sendPushNotification } = usePushNotifications();
  const playerCountRef = useRef<number>(0);

  useSocketEvent<{ players: Player[] }>(ServerEvents.PLAYER_LIST_UPDATED, (data) => {
    const newCount = data.players.length;
    const oldCount = playerCountRef.current;
    if (oldCount > 0) {
      if (newCount > oldCount) {
        showToast("انضم لاعب جديد", "info");
      } else if (newCount < oldCount) {
        showToast("غادر لاعب", "warning");
      }
    }
    playerCountRef.current = newCount;
  });

  useSocketEvent(ServerEvents.GAME_STARTED, () => {
    showToast("بدأت اللعبة!", "success");
    sendPushNotification("كلمة", "بدأت اللعبة!");
  });

  useSocketEvent(ServerEvents.GAME_STOPPED, () => {
    showToast("توقفت اللعبة", "warning");
  });

  useSocketEvent(ServerEvents.ADMIN_CHANGED, () => {
    showToast("تم تغيير المشرف", "info");
  });

  useSocketEvent<{ playerId: string; displayName?: string }>(
    ServerEvents.PLAYER_DISCONNECTED,
    (data) => {
      const name = data.displayName || "";
      showToast(`${name} انقطع الاتصال`, "warning");
    }
  );

  useSocketEvent<{ playerId: string; displayName?: string }>(
    ServerEvents.PLAYER_RECONNECTED,
    (data) => {
      const name = data.displayName || "";
      showToast(`${name} عاد للاتصال`, "success");
    }
  );

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    if (data.code === "INVALID_TOKEN") return;
    const message = ERROR_MESSAGES[data.code] || data.message || "حدث خطأ غير متوقع";
    showToast(message, "error");
  });

  // Impostor game-specific notifications
  useSocketEvent<{ phase: string }>(ImpostorEvents.PHASE_CHANGED, (data) => {
    const name = PHASE_NAMES[data.phase];
    if (name) showToast(name, "info");
    if (data.phase === "VOTING") {
      sendPushNotification("كلمة", "حان وقت التصويت");
    }
  });

  useSocketEvent(ImpostorEvents.ROLE_ASSIGNED, () => {
    showToast("تم توزيع الأدوار", "info");
    sendPushNotification("كلمة", "تم توزيع الأدوار - ادخل لرؤية دورك");
  });

  useSocketEvent(ImpostorEvents.WORD_ADDED, () => {
    showToast("تمت إضافة كلمة جديدة", "success");
  });

  useSocketEvent(ImpostorEvents.ROUND_RESULT, () => {
    sendPushNotification("كلمة", "ظهرت النتيجة");
  });
}
