"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import Button from "@/components/shared/Button";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
import { useTranslation } from "@/i18n/context";
import { connectSocket } from "@/lib/socket";
import { useSocketEvent } from "@/hooks/useSocketEvents";
import { storeReconnectData } from "@/hooks/useReconnect";
import type { Room, ActionRejectedPayload, Player } from "@/lib/api-types";

export default function JoinPage() {
  return (
    <Suspense fallback={<Layout><div className="flex items-center justify-center py-20"><span className="text-foreground-dim text-sm">...</span></div></Layout>}>
      <JoinPageContent />
    </Suspense>
  );
}

function JoinPageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setRoom } = useRoom();
  const { savedDisplayName, hydrated, setSavedDisplayName, setMyPlayer } = usePlayer();

  const searchParams = useSearchParams();
  const prefilledCode = searchParams.get("code")?.toUpperCase() || "";
  const isInviteLink = !!prefilledCode;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Load saved name
  useEffect(() => {
    if (hydrated && savedDisplayName) {
      setName(savedDisplayName);
    }
  }, [hydrated, savedDisplayName]);

  useEffect(() => {
    if (prefilledCode) setCode(prefilledCode);
  }, [prefilledCode]);

  useSocketEvent<{ room: Room; player: Player; reconnectToken: string }>(
    "room_joined",
    (data) => {
      setRoom(data.room);
      setMyPlayer(data.player.id, data.player.displayName);
      if (data.reconnectToken && data.room?.code) {
        storeReconnectData(data.room.code, data.reconnectToken);
      }
      router.push(`/room/?code=${data.room.code}`);
    }
  );

  useSocketEvent<ActionRejectedPayload>("action_rejected", (data) => {
    setErrorCode(data.code);
    setLoading(false);
  });

  const handleJoin = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) return;

    // Save name if not already saved
    if (!savedDisplayName || savedDisplayName !== trimmedName) {
      setSavedDisplayName(trimmedName);
    }

    setErrorCode(null);
    setLoading(true);
    const socket = connectSocket();
    socket.emit("join_room", {
      code: trimmedCode,
      displayName: trimmedName,
    });
  }, [name, code, savedDisplayName, setSavedDisplayName]);

  if (!hydrated) return null;

  const hasName = !!name.trim();
  const hasCode = !!code.trim();

  return (
    <Layout>
      <div className="flex flex-col items-center gap-8 animate-fade-up">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-accent">{t("room.join")}</h1>
          <div className="h-px w-16 mx-auto bg-accent/30" />
          {isInviteLink && (
            <p className="text-sm text-foreground-muted">{t("join.inviteDesc")}</p>
          )}
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-5 w-full max-w-sm stagger">
          {/* Name input */}
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium text-foreground-muted mb-1.5">
              {t("name.label")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("name.placeholder")}
              maxLength={20}
              autoComplete="off"
              disabled={loading}
              className="w-full bg-surface-raised border border-border-visible rounded-xl h-11 px-3 text-right text-sm text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all disabled:opacity-40"
            />
          </div>

          {/* Room code input */}
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium text-foreground-muted mb-1.5">
              {t("room.code")}
            </label>
            <input
              dir="ltr"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXX"
              disabled={loading || isInviteLink}
              maxLength={8}
              autoFocus={!!savedDisplayName}
              className="w-full bg-surface-raised border border-border-visible rounded-xl h-11 px-4 text-center tracking-[0.3em] font-bold text-accent placeholder:text-foreground-dim placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all disabled:opacity-40"
            />
          </div>

          {errorCode && <ErrorMessage code={errorCode} />}

          <Button
            type="submit"
            loading={loading}
            disabled={!hasName || !hasCode}
          >
            {t("room.join")}
          </Button>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="text-xs text-foreground-dim hover:text-foreground transition-colors cursor-pointer text-center"
          >
            {t("common.back")}
          </button>
        </form>
      </div>
    </Layout>
  );
}
