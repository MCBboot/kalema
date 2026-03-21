"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
import { connectSocket } from "@/lib/socket";
import { useSocketEvent } from "@/hooks/useSocketEvents";
import { cn } from "@/utils/rtl";
import type {
  AdminMode,
  Room,
  ActionRejectedPayload,
  Player,
} from "@/lib/api-types";

export default function CreatePage() {
  const router = useRouter();
  const { setRoom } = useRoom();
  const { setMyPlayer } = usePlayer();

  const [displayName, setDisplayName] = useState("");
  const [adminMode, setAdminMode] = useState<AdminMode>("ADMIN_PLAYER");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useSocketEvent<{ room: Room; player: Player; token: string }>(
    "room_created",
    (data) => {
      setRoom(data.room);
      setMyPlayer(data.player.id, data.player.displayName);
      router.push(`/room/${data.room.code}`);
    }
  );

  useSocketEvent<ActionRejectedPayload>("action_rejected", (data) => {
    setErrorCode(data.code);
    setLoading(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setErrorCode(null);
    setLoading(true);
    const socket = connectSocket();
    socket.emit("create_room", { displayName: displayName.trim(), adminMode });
  };

  return (
    <Layout title="انشاء غرفة">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          label="اسمك"
          value={displayName}
          onChange={setDisplayName}
          placeholder="ادخل اسمك"
          maxLength={20}
          disabled={loading}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            نوع المشرف
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setAdminMode("ADMIN_PLAYER")}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-4 py-4 transition-colors",
                adminMode === "ADMIN_PLAYER"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-foreground/20 text-foreground/60 hover:border-foreground/40"
              )}
            >
              <span className="font-semibold text-sm">مشرف ولاعب</span>
              <span className="text-xs opacity-70">تتحكم بالغرفة وتلعب أيضاً</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setAdminMode("ADMIN_ONLY")}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-4 py-4 transition-colors",
                adminMode === "ADMIN_ONLY"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-foreground/20 text-foreground/60 hover:border-foreground/40"
              )}
            >
              <span className="font-semibold text-sm">مشرف فقط</span>
              <span className="text-xs opacity-70">تتحكم بالغرفة فقط</span>
            </button>
          </div>
        </div>

        {errorCode && <ErrorMessage code={errorCode} />}

        <Button type="submit" loading={loading} disabled={!displayName.trim()}>
          انشاء غرفة
        </Button>
      </form>
    </Layout>
  );
}
