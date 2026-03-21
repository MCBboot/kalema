"use client";
import React from "react";
import type { Player } from "@/lib/api-types";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  isAdmin?: boolean;
  onKick?: (playerId: string) => void;
  onTransfer?: (playerId: string) => void;
}

const PlayerRow = React.memo(function PlayerRow({
  player,
  isMe,
  isAdmin,
  onKick,
  onTransfer,
}: {
  player: Player;
  isMe: boolean;
  isAdmin: boolean;
  onKick?: (playerId: string) => void;
  onTransfer?: (playerId: string) => void;
}) {
  const isOnline = player.type === "ONLINE";
  const isDisconnected = isOnline && !player.isConnected;
  const showActions = isAdmin && !player.isAdmin;

  return (
    <div className="flex items-center justify-between py-3 px-2">
      <div className="flex items-center gap-3">
        {/* Online/offline indicator */}
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            !isOnline
              ? "bg-gray-500"
              : isDisconnected
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        />
        <span className={`font-medium ${isDisconnected ? "text-foreground/40" : ""}`}>
          {player.displayName}
        </span>
        {isMe && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            أنت
          </span>
        )}
        {player.isAdmin && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
            مشرف
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showActions && (
          <>
            <button
              onClick={() => onTransfer?.(player.id)}
              className="text-xs px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              title="نقل الإدارة"
            >
              نقل
            </button>
            <button
              onClick={() => onKick?.(player.id)}
              className="text-xs px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="طرد"
            >
              طرد
            </button>
          </>
        )}
        <span className="text-xs text-foreground/40">
          {!isOnline
            ? "غير متصل"
            : isDisconnected
            ? "انقطع الاتصال"
            : "متصل"}
        </span>
      </div>
    </div>
  );
});

export default function PlayerList({
  players,
  currentPlayerId,
  isAdmin = false,
  onKick,
  onTransfer,
}: PlayerListProps) {
  // Group: online first, then offline
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.type === "ONLINE" && b.type !== "ONLINE") return -1;
    if (a.type !== "ONLINE" && b.type === "ONLINE") return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3">
        اللاعبون ({players.length})
      </h2>
      <div className="bg-foreground/5 border border-foreground/20 rounded-xl divide-y divide-foreground/10">
        {sortedPlayers.length === 0 ? (
          <div className="py-6 text-center text-foreground/40">
            لا يوجد لاعبون بعد
          </div>
        ) : (
          sortedPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              isMe={player.id === currentPlayerId}
              isAdmin={isAdmin}
              onKick={onKick}
              onTransfer={onTransfer}
            />
          ))
        )}
      </div>
    </div>
  );
}
