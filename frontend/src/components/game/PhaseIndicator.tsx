"use client";
import { cn } from "@/utils/rtl";
import type { RoomStatus } from "@/lib/api-types";

interface PhaseIndicatorProps {
  currentPhase: string;
}

const PHASES: { key: RoomStatus; label: string }[] = [
  { key: "WAITING", label: "الانتظار" },
  { key: "ROLE_REVEAL", label: "كشف الأدوار" },
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
    <div className="w-full">
      <div className="flex items-center justify-between">
        {PHASES.map((phase, index) => {
          const isCompleted = !isStopped && currentIndex > index;
          const isCurrent = !isStopped && currentIndex === index;
          const isFuture = isStopped || currentIndex < index;

          return (
            <div key={phase.key} className="flex items-center flex-1 last:flex-none">
              {/* Phase dot and label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-colors",
                    isCompleted && "bg-primary border-primary",
                    isCurrent && "bg-primary border-primary ring-2 ring-primary/30",
                    isFuture && "bg-transparent border-foreground/20"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] whitespace-nowrap transition-colors",
                    isCompleted && "text-primary",
                    isCurrent && "text-primary font-semibold",
                    isFuture && "text-foreground/30"
                  )}
                >
                  {phase.label}
                </span>
              </div>
              {/* Connecting line */}
              {index < PHASES.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 transition-colors",
                    !isStopped && currentIndex > index
                      ? "bg-primary"
                      : "bg-foreground/10"
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
