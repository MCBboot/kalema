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

  // Offline players who haven't voted yet
  const offlinePending = players.filter(
    (p) => p.type === "OFFLINE" && !votedOfflineIds.has(p.id)
  );

  // Available targets (all players except the one voting)
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
    <div className="w-full bg-foreground/5 border border-foreground/20 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-center">تصويت اللاعبين غير المتصلين</h3>

      {offlinePending.map((offlinePlayer) => {
        const targets = getTargets(offlinePlayer.id);
        const selected = selectedTargets[offlinePlayer.id] ?? "";

        return (
          <div
            key={offlinePlayer.id}
            className="bg-foreground/5 rounded-xl p-4 space-y-3"
          >
            <span className="font-medium">{offlinePlayer.displayName}</span>

            <select
              value={selected}
              onChange={(e) => handleTargetChange(offlinePlayer.id, e.target.value)}
              className="w-full h-10 rounded-lg bg-background border border-foreground/20 px-3 text-foreground text-sm"
            >
              <option value="">اختر لاعبًا</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
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
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
