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

  const eligibleTargets = players.filter((p) => p.id !== currentPlayerId);

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
      <div className="w-full space-y-6 animate-fade-up">
        <div className="card p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center">
            <span className="text-accent text-xl">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-accent">تم التصويت</h2>
          {votedPlayer && (
            <div className="mt-3 inline-block bg-accent/10 border border-accent/20 rounded-xl px-4 py-2">
              <span className="text-accent font-semibold text-sm">{votedPlayer.displayName}</span>
            </div>
          )}
          <p className="text-foreground-muted mt-3 text-sm">في انتظار تصويت اللاعبين الآخرين</p>
        </div>
        <VoteProgress totalEligible={totalEligible} votedCount={votedCount} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-up">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-accent mb-1">مرحلة التصويت</h2>
        <p className="text-foreground-muted text-sm">صوّت لمن تعتقد أنه المحتال</p>
      </div>

      {selectedTarget && selectedPlayer && (
        <div className="card-raised border-accent/20 p-6 text-center space-y-4">
          <p className="text-lg font-semibold">
            هل تريد التصويت ضد <span className="text-accent">{selectedPlayer.displayName}</span>؟
          </p>
          <div className="flex gap-3">
            <Button onClick={handleConfirmVote}>تأكيد</Button>
            <Button variant="secondary" onClick={handleCancel}>إلغاء</Button>
          </div>
        </div>
      )}

      {!selectedTarget && (
        <div className="w-full space-y-2 stagger">
          {eligibleTargets.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedTarget(player.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                "bg-surface border-border-visible",
                "hover:border-accent/30 hover:bg-accent-glow",
                "active:scale-[0.98] cursor-pointer"
              )}
            >
              <span className="font-medium text-sm">{player.displayName}</span>
              <span className="text-foreground-dim text-xs">
                {player.isConnected ? "متصل" : "غير متصل"}
              </span>
            </button>
          ))}
        </div>
      )}

      <VoteProgress totalEligible={totalEligible} votedCount={votedCount} />

      {error && (
        <div className="bg-danger-surface border border-danger/20 rounded-2xl p-3 text-center">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
