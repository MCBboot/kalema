"use client";
import { useState, useCallback } from "react";
import { useSocketEmit, useSocketEvent } from "@/hooks/useSocketEvents";
import {
  ClientEvents,
  ServerEvents,
  type Player,
  type ActionRejectedPayload,
} from "@/lib/api-types";
import Button from "@/components/shared/Button";

interface OfflineVotingProps {
  players: Player[];
  currentPlayerId: string | null;
}

export default function OfflineVoting({ players, currentPlayerId }: OfflineVotingProps) {
  const emit = useSocketEmit();
  const [votedOfflineIds, setVotedOfflineIds] = useState<Set<string>>(new Set());
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    setError(data.message);
  });

  const offlinePending = players.filter(
    (p) => p.type === "OFFLINE" && !votedOfflineIds.has(p.id)
  );

  const getTargets = (voterId: string) =>
    players.filter((p) => p.id !== voterId);

  const handleTargetChange = useCallback((offlinePlayerId: string, targetId: string) => {
    setSelectedTargets((prev) => ({ ...prev, [offlinePlayerId]: targetId }));
  }, []);

  const handleSubmitVote = useCallback(
    (offlinePlayerId: string) => {
      const targetPlayerId = selectedTargets[offlinePlayerId];
      if (!targetPlayerId) return;
      emit(ClientEvents.SUBMIT_VOTE, { targetPlayerId, offlinePlayerId });
      setVotedOfflineIds((prev) => new Set(prev).add(offlinePlayerId));
      setError(null);
    },
    [selectedTargets, emit]
  );

  if (offlinePending.length === 0) return null;

  return (
    <div className="w-full card p-4 sm:p-5 space-y-4">
      <h3 className="text-xs sm:text-sm font-bold text-foreground-muted text-center">تصويت اللاعبين غير المتصلين</h3>

      {offlinePending.map((offlinePlayer) => {
        const targets = getTargets(offlinePlayer.id);
        const selected = selectedTargets[offlinePlayer.id] ?? "";

        return (
          <div key={offlinePlayer.id} className="bg-surface-raised rounded-xl p-3 sm:p-4 space-y-2.5">
            <span className="font-medium text-sm">{offlinePlayer.displayName}</span>
            <select
              value={selected}
              onChange={(e) => handleTargetChange(offlinePlayer.id, e.target.value)}
              className="w-full h-10 rounded-xl bg-surface border border-border-visible px-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              <option value="">اختر لاعبًا</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>
            <Button
              onClick={() => handleSubmitVote(offlinePlayer.id)}
              disabled={!selected}
              className="h-10 text-sm"
            >
              صوّت
            </Button>
          </div>
        );
      })}

      {error && (
        <div className="bg-danger-surface border border-danger/20 rounded-xl p-3 text-center">
          <p className="text-danger text-xs sm:text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
