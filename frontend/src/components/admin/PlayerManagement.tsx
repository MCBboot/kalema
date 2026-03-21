"use client";
import { useState, useCallback } from "react";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
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
  const { myPlayerId } = usePlayer();
  const emit = useSocketEmit();

  const nonAdminPlayers = room
    ? room.players.filter((p) => !p.isAdmin)
    : [];

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
    <div>
      <h3 className="text-md font-semibold mb-3">إدارة اللاعبين</h3>

      {/* Add offline player */}
      <div className="flex items-end gap-2 mb-4">
        <Input
          value={playerName}
          onChange={setPlayerName}
          placeholder="اسم اللاعب"
          className="flex-1"
        />
        <Button
          onClick={handleAddOffline}
          disabled={!playerName.trim()}
          className="w-auto px-6 flex-shrink-0"
        >
          إضافة
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage code={error} />
        </div>
      )}

      {/* Player actions list */}
      {nonAdminPlayers.length > 0 && (
        <div className="space-y-2">
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
    <div className="flex items-center justify-between bg-foreground/5 rounded-xl px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{player.displayName}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            isOnline
              ? "bg-green-500/20 text-green-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {isOnline ? "متصل" : "غير متصل"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTransfer(player.id, player.displayName)}
          className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
        >
          نقل الإدارة
        </button>
        <button
          onClick={() => onKick(player.id, player.displayName)}
          className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          طرد
        </button>
        {!isOnline && (
          <button
            onClick={() => onRemoveOffline(player.id)}
            className="text-xs px-2 py-1 rounded-lg bg-foreground/10 text-foreground/60 hover:bg-foreground/20 transition-colors"
          >
            إزالة
          </button>
        )}
      </div>
    </div>
  );
}
