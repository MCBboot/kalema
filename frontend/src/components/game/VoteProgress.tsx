"use client";

interface VoteProgressProps {
  totalEligible: number;
  votedCount: number;
}

export default function VoteProgress({ totalEligible, votedCount }: VoteProgressProps) {
  const percentage = totalEligible > 0 ? Math.round((votedCount / totalEligible) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-foreground/60">التقدم في التصويت</span>
        <span className="text-sm font-semibold text-foreground/80">
          {votedCount} من {totalEligible}
        </span>
      </div>
      <div className="w-full h-3 bg-foreground/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
