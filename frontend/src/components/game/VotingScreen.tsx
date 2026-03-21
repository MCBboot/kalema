"use client";
import { useState, useCallback } from "react";
import { cn } from "@/utils/rtl";
import { useSocketEmit, useSocketEvent } from "@/hooks/useSocketEvents";
import {
  ClientEvents,
  ServerEvents,
  type Player,
  type ActionRejectedPayload,
} from "@/lib/api-types";
import Button from "@/components/shared/Button";
import VoteProgress from "@/components/game/VoteProgress";

interface VotingScreenProps {
  players: Player[];
  currentPlayerId: string | null;
  isAdmin: boolean;
  totalEligible: number;
  votedCount: number;
}

export default function VotingScreen({
  players,
  currentPlayerId,
  totalEligible,
  votedCount,
}: VotingScreenProps) {
  const emit = useSocketEmit();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [votedTarget, setVotedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    setError(data.message);
  });

  const eligibleTargets = players.filter(
    (p) => p.id !== currentPlayerId
  );

  const handleConfirmVote = useCallback(() => {
    if (!selectedTarget) return;
    emit(ClientEvents.SUBMIT_VOTE, { targetPlayerId: selectedTarget });
    setVotedTarget(selectedTarget);
    setHasVoted(true);
    setSelectedTarget(null);
    setError(null);
  }, [selectedTarget, emit]);

  const handleCancel = useCallback(() => {
    setSelectedTarget(null);
  }, []);

  const selectedPlayer = players.find((p) => p.id === selectedTarget);
  const votedPlayer = players.find((p) => p.id === votedTarget);

  if (hasVoted) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-foreground/5 border border-foreground/20 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">&#10003;</div>
          <h2 className="text-xl font-bold text-primary">تم التصويت</h2>
          {votedPlayer && (
            <div className="mt-3 inline-block bg-primary/15 border border-primary/30 rounded-xl px-4 py-2">
              <span className="text-primary font-semibold">{votedPlayer.displayName}</span>
            </div>
          )}
          <p className="text-foreground/50 mt-2">في انتظار تصويت اللاعبين الآخرين</p>
        </div>
        <VoteProgress totalEligible={totalEligible} votedCount={votedCount} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">مرحلة التصويت</h2>
        <p className="text-foreground/50">صوّت لمن تعتقد أنه المحتال</p>
      </div>

      {/* Confirmation dialog */}
      {selectedTarget && selectedPlayer && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center space-y-4">
          <p className="text-lg font-semibold">
            هل تريد التصويت ضد {selectedPlayer.displayName}؟
          </p>
          <div className="flex gap-3">
            <Button onClick={handleConfirmVote}>تأكيد</Button>
            <Button variant="secondary" onClick={handleCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* Player list */}
      {!selectedTarget && (
        <div className="w-full space-y-2">
          {eligibleTargets.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-colors",
                "bg-foreground/5 border-foreground/10 hover:border-primary/50 hover:bg-primary/5",
                "active:scale-[0.98] transform"
              )}
            >
              <span className="font-medium">{player.displayName}</span>
              <span className="text-foreground/30 text-sm">
                {player.isConnected ? "متصل" : "غير متصل"}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Vote progress */}
      <VoteProgress totalEligible={totalEligible} votedCount={votedCount} />

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
