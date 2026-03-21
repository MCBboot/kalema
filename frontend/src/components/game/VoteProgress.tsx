"use client";

interface VoteProgressProps {
  totalEligible: number;
  votedCount: number;
}

export default function VoteProgress({ totalEligible, votedCount }: VoteProgressProps) {
  const percentage = totalEligible > 0 ? (votedCount / totalEligible) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>التقدم في التصويت</span>
        <span className="font-mono text-accent">{votedCount} / {totalEligible}</span>
      </div>
      <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_var(--accent-dim)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
