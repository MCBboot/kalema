"use client";
import { useState, useCallback } from "react";
import { usePlayer } from "@/store/playerStore";
import { useRoom } from "@/store/roomStore";
import { useSocketEmit, useSocketEvent } from "@/hooks/useSocketEvents";
import {
  ClientEvents,
  ServerEvents,
  type ActionRejectedPayload,
} from "@/lib/api-types";
import Button from "@/components/shared/Button";

export default function GameControls() {
  const { isAdmin } = usePlayer();
  const { room } = useRoom();
  const emit = useSocketEmit();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    setError(data.message);
    setLoading(false);
  });

  const handleAction = useCallback(
    (event: string) => {
      setError(null);
      setLoading(true);
      emit(event);
      setTimeout(() => setLoading(false), 2000);
    },
    [emit]
  );

  if (!isAdmin || !room) return null;

  const status = room.status;
  const isActive = status !== "WAITING" && status !== "STOPPED";

  return (
    <div className="w-full space-y-3">
      {status === "WAITING" && (
        <Button onClick={() => handleAction(ClientEvents.START_GAME)} loading={loading}>
          ابدأ اللعبة
        </Button>
      )}

      {status === "ROLE_REVEAL" && (
        <Button onClick={() => handleAction(ClientEvents.ADVANCE_PHASE)} loading={loading}>
          التالي: النقاش
        </Button>
      )}

      {status === "DISCUSSION" && (
        <Button onClick={() => handleAction(ClientEvents.ADVANCE_PHASE)} loading={loading}>
          التالي: التصويت
        </Button>
      )}

      {status === "VOTING" && (
        <div className="text-center py-3">
          <span className="text-foreground-muted text-sm">في انتظار التصويت</span>
        </div>
      )}

      {status === "RESULT" && (
        <Button onClick={() => handleAction(ClientEvents.ADVANCE_PHASE)} loading={loading}>
          جولة جديدة
        </Button>
      )}

      {isActive && (
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("هل تريد إيقاف اللعبة؟")) return;
            handleAction(ClientEvents.STOP_GAME);
          }}
          loading={loading}
        >
          إيقاف اللعبة
        </Button>
      )}

      {error && (
        <div className="bg-danger-surface border border-danger/20 rounded-2xl p-3 text-center">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
