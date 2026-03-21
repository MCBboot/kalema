"use client";
import { cn } from "@/utils/rtl";
import type { RoomStatus } from "@/lib/api-types";

interface PhaseIndicatorProps {
  currentPhase: string;
}

const PHASES: { key: RoomStatus; label: string }[] = [
  { key: "WAITING", label: "الانتظار" },
  { key: "ROLE_REVEAL", label: "الأدوار" },
  { key: "DISCUSSION", label: "النقاش" },
  { key: "VOTING", label: "التصويت" },
  { key: "RESULT", label: "النتيجة" },
];

function getPhaseIndex(phase: string): number {
  return PHASES.findIndex((p) => p.key === phase);
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const isStopped = currentPhase === "STOPPED";
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between">
        {PHASES.map((phase, index) => {
          const isCompleted = !isStopped && currentIndex > index;
          const isCurrent = !isStopped && currentIndex === index;
          const isFuture = isStopped || currentIndex < index;

          return (
            <div key={phase.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    isCompleted && "bg-accent shadow-[0_0_8px_var(--accent-dim)]",
                    isCurrent && "bg-accent shadow-[0_0_12px_var(--accent-dim)] scale-125",
                    isFuture && "bg-foreground-dim/50"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] whitespace-nowrap transition-all duration-500",
                    isCompleted && "text-accent/70",
                    isCurrent && "text-accent font-bold",
                    isFuture && "text-foreground-dim"
                  )}
                >
                  {phase.label}
                </span>
              </div>
              {index < PHASES.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 mx-2 transition-all duration-500",
                    !isStopped && currentIndex > index
                      ? "bg-accent/40"
                      : "bg-foreground-dim/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
