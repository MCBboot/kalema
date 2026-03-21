"use client";
import { useState, useCallback } from "react";
import { cn } from "@/utils/rtl";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useRoom } from "@/store/roomStore";
import { useSocketEvent, useSocketEmit } from "@/hooks/useSocketEvents";
import {
  ClientEvents,
  ServerEvents,
  type ActionRejectedPayload,
  type Player,
} from "@/lib/api-types";

export default function PlayerManagement() {
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { room } = useRoom();
  const emit = useSocketEmit();

  const nonAdminPlayers = room ? room.players.filter((p) => !p.isAdmin) : [];

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    setError(data.code);
  });

  const handleAddOffline = useCallback(() => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    setError(null);
    emit(ClientEvents.ADD_OFFLINE_PLAYER, { displayName: trimmed });
    setPlayerName("");
  }, [playerName, emit]);

  const handleKick = useCallback(
    (targetPlayerId: string, name: string) => {
      if (!window.confirm(`هل تريد طرد "${name}"؟`)) return;
      emit(ClientEvents.KICK_PLAYER, { targetPlayerId });
    },
    [emit]
  );

  const handleTransfer = useCallback(
    (targetPlayerId: string, name: string) => {
      if (!window.confirm(`هل تريد نقل الإدارة إلى "${name}"؟`)) return;
      emit(ClientEvents.TRANSFER_ADMIN, { targetPlayerId });
    },
    [emit]
  );

  const handleRemoveOffline = useCallback(
    (targetPlayerId: string) => {
      emit(ClientEvents.REMOVE_OFFLINE_PLAYER, { targetPlayerId });
    },
    [emit]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] sm:text-xs font-bold text-foreground-muted tracking-wide uppercase">إدارة اللاعبين</h3>

      {/* Add offline player — stacked on mobile, side-by-side on larger */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={playerName}
          onChange={setPlayerName}
          placeholder="اسم لاعب غير متصل"
          className="flex-1"
        />
        <Button
          onClick={handleAddOffline}
          disabled={!playerName.trim()}
          className="w-full sm:w-auto sm:px-6 flex-shrink-0"
        >
          إضافة
        </Button>
      </div>

      {error && <ErrorMessage code={error} />}

      {/* Player list */}
      {nonAdminPlayers.length > 0 && (
        <div className="space-y-1.5">
          {nonAdminPlayers.map((player) => (
            <PlayerActionRow
              key={player.id}
              player={player}
              onKick={handleKick}
              onTransfer={handleTransfer}
              onRemoveOffline={handleRemoveOffline}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerActionRow({
  player,
  onKick,
  onTransfer,
  onRemoveOffline,
}: {
  player: Player;
  onKick: (id: string, name: string) => void;
  onTransfer: (id: string, name: string) => void;
  onRemoveOffline: (id: string) => void;
}) {
  const isOnline = player.type === "ONLINE";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{player.displayName}</span>
        <span
          className={cn(
            "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0",
            isOnline
              ? "bg-success/10 text-success border-success/20"
              : "bg-foreground-dim/10 text-foreground-dim border-foreground-dim/20"
          )}
        >
          {isOnline ? "متصل" : "غير متصل"}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onTransfer(player.id, player.displayName)}
          className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg bg-accent/10 text-accent/70 hover:bg-accent/20 hover:text-accent transition-all cursor-pointer"
        >
          نقل
        </button>
        <button
          onClick={() => onKick(player.id, player.displayName)}
          className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg bg-danger/10 text-danger/70 hover:bg-danger/20 hover:text-danger transition-all cursor-pointer"
        >
          طرد
        </button>
        {!isOnline && (
          <button
            onClick={() => onRemoveOffline(player.id)}
            className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg bg-foreground-dim/10 text-foreground-dim hover:bg-foreground-dim/20 transition-all cursor-pointer"
          >
            إزالة
          </button>
        )}
      </div>
    </div>
  );
}
