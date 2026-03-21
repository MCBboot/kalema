"use client";
import React from "react";
import { cn } from "@/utils/rtl";
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
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            !isOnline
              ? "bg-foreground-dim"
              : isDisconnected
              ? "bg-accent"
              : "bg-success"
          )}
        />
        <span className={cn("font-medium text-sm", isDisconnected && "text-foreground-muted")}>
          {player.displayName}
        </span>
        {isMe && (
          <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">
            أنت
          </span>
        )}
        {player.isAdmin && (
          <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">
            مشرف
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showActions && (
          <>
            <button
              onClick={() => onTransfer?.(player.id)}
              className="text-[10px] px-2 py-1 rounded-lg bg-accent/10 text-accent/70 hover:bg-accent/20 hover:text-accent transition-all border border-accent/10 cursor-pointer"
            >
              نقل
            </button>
            <button
              onClick={() => onKick?.(player.id)}
              className="text-[10px] px-2 py-1 rounded-lg bg-danger/10 text-danger/70 hover:bg-danger/20 hover:text-danger transition-all border border-danger/10 cursor-pointer"
            >
              طرد
            </button>
          </>
        )}
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
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.type === "ONLINE" && b.type !== "ONLINE") return -1;
    if (a.type !== "ONLINE" && b.type === "ONLINE") return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground-muted tracking-wide">اللاعبون</h2>
        <span className="text-xs text-foreground-dim font-mono">{players.length}</span>
      </div>
      <div className="card divide-y divide-border">
        {sortedPlayers.length === 0 ? (
          <div className="py-8 text-center text-foreground-dim text-sm">
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
