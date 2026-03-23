"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlayer } from "@/store/playerStore";
import { useRoom } from "@/store/roomStore";
import { useTranslation } from "@/i18n/context";
import { connectSocket } from "@/lib/socket";
import { useSocketEvent } from "@/hooks/useSocketEvents";
import { storeReconnectData } from "@/hooks/useReconnect";
import type { Room, Player, ActionRejectedPayload } from "@/lib/api-types";
import ErrorMessage from "@/components/shared/ErrorMessage";

export default function Home() {
  const router = useRouter();
  const { savedDisplayName, hydrated, setSavedDisplayName, setMyPlayer } = usePlayer();
  const { setRoom } = useRoom();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && savedDisplayName) {
      setName(savedDisplayName);
    }
  }, [hydrated, savedDisplayName]);

  const hasName = !!savedDisplayName?.trim();

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavedDisplayName(name.trim());
    setEditing(false);
  };

  // Listen for room_created to navigate
  useSocketEvent<{ room: Room; player: Player; reconnectToken: string }>(
    "room_created",
    (data) => {
      setRoom(data.room);
      setMyPlayer(data.player.id, data.player.displayName);
      if (data.reconnectToken && data.room?.code) {
        storeReconnectData(data.room.code, data.reconnectToken);
      }
      router.push(`/room/${data.room.code}`);
    }
  );

  useSocketEvent<ActionRejectedPayload>("action_rejected", (data) => {
    setErrorCode(data.code);
    setCreating(false);
  });

  const handleCreateRoom = useCallback(() => {
    if (!savedDisplayName?.trim()) return;
    setErrorCode(null);
    setCreating(true);
    const socket = connectSocket();
    socket.emit("create_room", { displayName: savedDisplayName.trim() });
  }, [savedDisplayName]);

  const showNameInput = !hasName || editing;

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <main className="flex flex-col items-center gap-14 animate-fade-up relative z-10">
        <div className="text-center space-y-3">
          <div className="relative">
            <h1 className="text-8xl font-bold text-accent tracking-tight">{t("app.title")}</h1>
            <div className="absolute -inset-4 bg-accent/5 blur-2xl rounded-full -z-10" />
          </div>
          <div className="h-px w-24 mx-auto bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
          <p className="text-lg text-foreground-muted tracking-wide">{t("app.subtitle")}</p>
        </div>

        {showNameInput ? (
          <form onSubmit={handleSaveName} className="flex flex-col gap-4 w-72 stagger">
            <div className="w-full">
              <label className="block text-xs sm:text-sm font-medium text-foreground-muted mb-1.5 sm:mb-2">
                {t("name.label")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("name.placeholder")}
                maxLength={20}
                autoComplete="off"
                autoFocus
                className="w-full bg-surface-raised border border-border-visible rounded-xl sm:rounded-2xl h-11 sm:h-12 px-3 sm:px-4 text-right text-sm sm:text-base text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold bg-accent text-background transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_24px_var(--accent-dim)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {t("common.continue")}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setName(savedDisplayName || ""); setEditing(false); }}
                className="text-xs text-foreground-dim hover:text-foreground transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
            )}
          </form>
        ) : (
          <div className="flex flex-col items-center gap-6 w-72 stagger">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-muted">
                {t("name.greeting", { name: savedDisplayName || "" })}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] text-foreground-dim hover:text-accent border border-border-visible hover:border-accent/30 rounded-lg px-2 py-0.5 transition-all cursor-pointer"
              >
                {t("common.change")}
              </button>
            </div>

            {errorCode && <ErrorMessage code={errorCode} />}

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="group flex h-14 items-center justify-center rounded-2xl bg-accent text-background text-lg font-bold transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_30px_var(--accent-dim)] active:scale-[0.98] disabled:opacity-60 cursor-pointer disabled:cursor-wait"
              >
                {creating ? t("common.loading") : t("room.create")}
              </button>
              <Link
                href="/join"
                className="group flex h-14 items-center justify-center rounded-2xl border border-border-visible text-foreground text-lg font-semibold transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-accent-glow active:scale-[0.98]"
              >
                {t("room.join")}
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="absolute bottom-6 text-center w-full">
        <span className="text-xs text-foreground-dim tracking-wider">{t("app.version")}</span>
      </footer>
    </div>
  );
}
