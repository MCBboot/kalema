"use client";
import { useSecret } from "@/store/secretStore";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";

export default function Discussion() {
  const { role, word } = useSecret();
  const { room } = useRoom();
  const { myPlayerId } = usePlayer();

  const players = room?.players ?? [];

  return (
    <div className="w-full space-y-6">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">مرحلة النقاش</h2>
        <p className="text-foreground/60">ناقشوا واكتشفوا من هو المحتال</p>
      </div>

      {/* Player list (simplified) */}
      <div className="bg-foreground/5 border border-foreground/20 rounded-xl divide-y divide-foreground/10">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-3 py-3 px-4">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                player.type !== "ONLINE"
                  ? "bg-gray-500"
                  : player.isConnected
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="font-medium">
              {player.displayName}
            </span>
            {player.id === myPlayerId && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                أنت
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Role-specific reminder */}
      {role === "impostor" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400 font-medium">حاول ألا تكشف نفسك</p>
        </div>
      )}
      {role === "normal" && word && (
        <div className="bg-foreground/5 border border-foreground/20 rounded-xl p-4 text-center">
          <span className="text-foreground/50 text-sm">كلمتك: </span>
          <span className="font-semibold text-primary">{word}</span>
        </div>
      )}
    </div>
  );
}
