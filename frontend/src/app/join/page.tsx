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
import type { Room, ActionRejectedPayload, Player } from "@/lib/api-types";

export default function JoinPage() {
  const router = useRouter();
  const { setRoom } = useRoom();
  const { setMyPlayer } = usePlayer();

  const [displayName, setDisplayName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useSocketEvent<{ room: Room; player: Player; reconnectToken: string }>(
    "room_joined",
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
    if (!displayName.trim() || !code.trim()) return;
    setErrorCode(null);
    setLoading(true);
    const socket = connectSocket();
    socket.emit("join_room", {
      code: code.trim().toUpperCase(),
      displayName: displayName.trim(),
    });
  };

  return (
    <Layout title="انضم لغرفة">
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
          <label className="block text-sm font-medium text-foreground-muted mb-2">
            رمز الغرفة
          </label>
          <input
            dir="ltr"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXX"
            disabled={loading}
            maxLength={8}
            className="w-full bg-surface border border-border-visible rounded-2xl h-12 px-4 text-center tracking-[0.4em] font-bold text-accent placeholder:text-foreground-dim placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>

        {errorCode && <ErrorMessage code={errorCode} />}

        <Button
          type="submit"
          loading={loading}
          disabled={!displayName.trim() || !code.trim()}
        >
          انضم
        </Button>
      </form>
    </Layout>
  );
}
