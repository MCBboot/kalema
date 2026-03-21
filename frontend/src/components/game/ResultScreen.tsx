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
      <div className="w-full text-center py-12">
        <span className="text-foreground/40">جاري تحميل النتيجة...</span>
      </div>
    );
  }

  // Build sorted vote tally
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
    <div className="w-full space-y-6">
      {/* Outcome banner */}
      <div
        className={cn(
          "rounded-2xl p-8 text-center border",
          result.impostorCaught
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        )}
      >
        <h2
          className={cn(
            "text-2xl font-bold mb-2",
            result.impostorCaught ? "text-green-400" : "text-red-400"
          )}
        >
          {result.impostorCaught ? "تم كشف المحتال!" : "!نجا المحتال"}
        </h2>
      </div>

      {/* Impostor and word info */}
      <div className="bg-foreground/5 border border-foreground/20 rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">المحتال</span>
          <span className="font-bold text-lg">{result.impostorName}</span>
        </div>
        <div className="h-px bg-foreground/10" />
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">الكلمة</span>
          <span className="font-bold text-lg text-primary">{result.word}</span>
        </div>
      </div>

      {/* Vote breakdown */}
      {tallyEntries.length > 0 && (
        <div className="bg-foreground/5 border border-foreground/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-center">نتائج التصويت</h3>
          <div className="space-y-2">
            {tallyEntries.map((entry) => (
              <div
                key={entry.playerId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  entry.isImpostor
                    ? "bg-red-500/10 border border-red-500/30"
                    : "bg-foreground/5"
                )}
              >
                <span className={cn("font-medium", entry.isImpostor && "text-red-400")}>
                  {entry.displayName}
                  {entry.isImpostor && (
                    <span className="text-xs mr-2 text-red-400">(المحتال)</span>
                  )}
                </span>
                <span className="font-bold text-lg">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
