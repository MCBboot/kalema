"use client";
import { useSecret } from "@/store/secretStore";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
import { cn } from "@/utils/rtl";

export default function Discussion() {
  const { role, word } = useSecret();
  const { room } = useRoom();
  const { myPlayerId } = usePlayer();

  const players = room?.players ?? [];

  return (
    <div className="w-full space-y-6 animate-fade-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-accent">مرحلة النقاش</h2>
        <p className="text-foreground-muted text-sm">ناقشوا واكتشفوا من هو المحتال</p>
      </div>

      <div className="card divide-y divide-border">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-3 py-3 px-4">
            <span
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                player.type !== "ONLINE"
                  ? "bg-foreground-dim"
                  : player.isConnected
                  ? "bg-success"
                  : "bg-accent"
              )}
            />
            <span className="font-medium text-sm">{player.displayName}</span>
            {player.id === myPlayerId && (
              <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                أنت
              </span>
            )}
          </div>
        ))}
      </div>

      {role === "impostor" && (
        <div className="bg-danger-surface border border-danger/20 rounded-2xl p-4 text-center">
          <p className="text-danger text-sm font-medium">حاول ألا تكشف نفسك</p>
        </div>
      )}
      {role === "normal" && word && (
        <div className="card p-4 text-center">
          <span className="text-foreground-muted text-xs">كلمتك: </span>
          <span className="font-bold text-accent">{word}</span>
        </div>
      )}
    </div>
  );
}
