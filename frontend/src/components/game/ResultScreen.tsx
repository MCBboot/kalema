"use client";
import { cn } from "@/utils/rtl";
import type { Player, RoundResultPayload } from "@/lib/api-types";

interface ResultScreenProps {
  result: RoundResultPayload | null;
  players: Player[];
}

export default function ResultScreen({ result, players }: ResultScreenProps) {
  if (!result) {
    return (
      <div className="w-full text-center py-16">
        <span className="text-foreground-muted">جاري تحميل النتيجة...</span>
      </div>
    );
  }

  const tallyEntries = Object.entries(result.voteTally)
    .map(([playerId, count]) => {
      const player = players.find((p) => p.id === playerId);
      return {
        playerId,
        displayName: player?.displayName ?? playerId,
        count,
        isImpostor: playerId === result.impostorId,
      };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div className="w-full space-y-6 stagger">
      {/* Outcome banner */}
      <div
        className={cn(
          "rounded-2xl p-10 text-center border-2 animate-fade-up",
          result.impostorCaught
            ? "bg-success-surface border-success/30"
            : "bg-danger-surface border-danger/30 pulse-danger"
        )}
      >
        <h2
          className={cn(
            "text-3xl font-bold",
            result.impostorCaught ? "text-success" : "text-danger"
          )}
        >
          {result.impostorCaught ? "!تم كشف المحتال" : "!نجا المحتال"}
        </h2>
      </div>

      {/* Impostor and word */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted text-sm">المحتال</span>
          <span className="font-bold text-danger">{result.impostorName}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-foreground-muted text-sm">الكلمة</span>
          <span className="font-bold text-accent">{result.word}</span>
        </div>
      </div>

      {/* Vote breakdown */}
      {tallyEntries.length > 0 && (
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground-muted text-center tracking-wide">نتائج التصويت</h3>
          <div className="space-y-2">
            {tallyEntries.map((entry) => (
              <div
                key={entry.playerId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-colors",
                  entry.isImpostor
                    ? "bg-danger-surface border border-danger/20"
                    : "bg-surface-raised"
                )}
              >
                <span className={cn("font-medium text-sm", entry.isImpostor && "text-danger")}>
                  {entry.displayName}
                  {entry.isImpostor && (
                    <span className="text-[10px] mr-2 text-danger/70">(المحتال)</span>
                  )}
                </span>
                <span className={cn("font-bold text-lg", entry.isImpostor ? "text-danger" : "text-accent")}>
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
