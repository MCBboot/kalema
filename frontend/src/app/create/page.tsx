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

  useSocketEvent<{ room: Room; player: Player; reconnectToken: string }>(
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 stagger">
        <Input
          label="اسمك"
          value={displayName}
          onChange={setDisplayName}
          placeholder="ادخل اسمك"
          maxLength={20}
          disabled={loading}
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-foreground-muted mb-3">
            نوع المشرف
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setAdminMode("ADMIN_PLAYER")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-5 transition-all duration-300 cursor-pointer",
                adminMode === "ADMIN_PLAYER"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-visible text-foreground-muted hover:border-accent/30"
              )}
            >
              <span className="font-bold text-sm">مشرف ولاعب</span>
              <span className="text-[10px] opacity-60">تتحكم وتلعب</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setAdminMode("ADMIN_ONLY")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-5 transition-all duration-300 cursor-pointer",
                adminMode === "ADMIN_ONLY"
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border-visible text-foreground-muted hover:border-accent/30"
              )}
            >
              <span className="font-bold text-sm">مشرف فقط</span>
              <span className="text-[10px] opacity-60">تتحكم فقط</span>
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
