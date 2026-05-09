"use client";
import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import RoomCode from "@/components/room/RoomCode";
import PlayerList from "@/components/room/PlayerList";
import GamePicker from "@/components/room/GamePicker";
import ReconnectBanner from "@/components/shared/ReconnectBanner";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
import { useConnection } from "@/store/connectionStore";
import { useSocketEvent, useSocketEmit } from "@/hooks/useSocketEvents";
import { useTranslation } from "@/i18n/context";
import {
  useReconnect,
  storeReconnectData,
  clearReconnectData,
  getStoredReconnectToken,
} from "@/hooks/useReconnect";
import { useGameNotifications } from "@/hooks/useGameNotifications";
import { connectSocket } from "@/lib/socket";
import { getGame } from "@/games/registry";
import {
  ClientEvents,
  ServerEvents,
  type Room,
  type Player,
} from "@/lib/api-types";
import Button from "@/components/shared/Button";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  const { t } = useTranslation();
  const { room, hydrated, setRoom, updatePlayers, clearRoom } = useRoom();
  const { myPlayerId, isAdmin, setMyPlayer, clearPlayer } = usePlayer();
  const { isConnected } = useConnection();
  const emit = useSocketEmit();

  useGameNotifications();

  const [reconnectStatus, setReconnectStatus] = useState<"idle" | "reconnecting" | "failed">("idle");
  const reconnectAttempted = useRef(false);

  // Store reconnect tokens
  useSocketEvent<{ room: Room; playerId: string; reconnectToken: string }>(
    ServerEvents.ROOM_CREATED,
    (data) => {
      if (data.reconnectToken && data.room?.code) {
        storeReconnectData(data.room.code, data.reconnectToken);
      }
    }
  );

  useSocketEvent<{ room: Room; playerId: string; reconnectToken: string }>(
    ServerEvents.ROOM_JOINED,
    (data) => {
      if (data.reconnectToken && data.room?.code) {
        storeReconnectData(data.room.code, data.reconnectToken);
      }
    }
  );

  const { attemptReconnect } = useReconnect({
    onSessionRecovered: useCallback(
      (data: any) => {
        setRoom(data.room);
        setMyPlayer(data.playerId, data.displayName);
        setReconnectStatus("idle");
      },
      [setRoom, setMyPlayer]
    ),
    onReconnectFailed: useCallback(() => {
      setReconnectStatus("failed");
    }, []),
  });

  useEffect(() => { connectSocket(); }, []);

  useEffect(() => {
    if (reconnectAttempted.current) return;
    if (!isConnected) return;
    const token = getStoredReconnectToken(roomCode);
    if (token) {
      reconnectAttempted.current = true;
      setReconnectStatus("reconnecting");
      attemptReconnect(roomCode);
    }
  }, [isConnected, roomCode, attemptReconnect]);

  useEffect(() => {
    if (!hydrated) return;
    if (!room && !myPlayerId && reconnectStatus === "idle") {
      const token = getStoredReconnectToken(roomCode);
      if (!token) {
        clearRoom();
        clearPlayer();
        // Redirect to join page with the room code so user can join
        router.replace(`/kalema/join?code=${roomCode}`);
      }
    }
  }, [hydrated, room, myPlayerId, reconnectStatus, roomCode, router, clearRoom, clearPlayer]);

  const handleLeave = useCallback(() => {
    emit(ClientEvents.LEAVE_ROOM);
    clearRoom();
    clearPlayer();
    clearReconnectData(roomCode);
    router.replace("/kalema/");
  }, [emit, clearRoom, clearPlayer, roomCode, router]);

  // Core socket listeners
  useSocketEvent<Room>(ServerEvents.ROOM_STATE_UPDATED, (data) => setRoom(data));
  useSocketEvent<{ players: Player[] }>(ServerEvents.PLAYER_LIST_UPDATED, (data) => updatePlayers(data.players));

  useSocketEvent<{ newAdminId: string }>(ServerEvents.ADMIN_CHANGED, (data) => {
    if (room) {
      const updatedPlayers = room.players.map((p) => ({ ...p, isAdmin: p.id === data.newAdminId }));
      setRoom({ ...room, adminPlayerId: data.newAdminId, players: updatedPlayers });
    }
  });

  useSocketEvent<{ playerId: string }>(ServerEvents.PLAYER_DISCONNECTED, (data) => {
    if (room) updatePlayers(room.players.map((p) => p.id === data.playerId ? { ...p, isConnected: false } : p));
  });

  useSocketEvent<{ playerId: string }>(ServerEvents.PLAYER_RECONNECTED, (data) => {
    if (room) updatePlayers(room.players.map((p) => p.id === data.playerId ? { ...p, isConnected: true } : p));
  });

  useSocketEvent<any>(ServerEvents.GAME_STARTED, (data) => {
    if (room) {
      setRoom({ ...room, status: data.roomStatus || "PLAYING", gameState: data.gameState });
    }
  });

  useSocketEvent<any>(ServerEvents.GAME_STOPPED, (data) => {
    setRoom(data);
  });

  useSocketEvent<{ gameId: string }>(ServerEvents.GAME_SELECTED, () => {
    // Room state update will follow
  });

  useSocketEvent<{ gameState: unknown }>(ServerEvents.GAME_STATE_UPDATED, (data) => {
    if (room) {
      setRoom({ ...room, gameState: data.gameState });
    }
  });

  const handleKick = useCallback(
    (targetPlayerId: string) => {
      const player = room?.players.find((p) => p.id === targetPlayerId);
      if (!player) return;
      if (!window.confirm(t("admin.kickConfirm", { name: player.displayName }))) return;
      emit(ClientEvents.KICK_PLAYER, { targetPlayerId });
    },
    [room, emit, t]
  );

  const handleTransfer = useCallback(
    (targetPlayerId: string) => {
      const player = room?.players.find((p) => p.id === targetPlayerId);
      if (!player) return;
      if (!window.confirm(t("admin.transferConfirm", { name: player.displayName }))) return;
      emit(ClientEvents.TRANSFER_ADMIN, { targetPlayerId });
    },
    [room, emit, t]
  );

  const handleLockRoom = useCallback(() => emit(ClientEvents.LOCK_ROOM), [emit]);
  const handleUnlockRoom = useCallback(() => emit(ClientEvents.UNLOCK_ROOM), [emit]);
  const handleSelectGame = useCallback((gameId: string) => emit(ClientEvents.SELECT_GAME, { gameId }), [emit]);
  const handleStartGame = useCallback(() => emit(ClientEvents.START_GAME), [emit]);
  const handleStopGame = useCallback(() => {
    if (!window.confirm(t("room.stopGame") + "?")) return;
    emit(ClientEvents.STOP_GAME);
  }, [emit, t]);

  const showReconnectBanner = reconnectStatus === "reconnecting" || reconnectStatus === "failed";

  // Loading states
  if (!room || !myPlayerId) {
    if (reconnectStatus === "reconnecting") {
      return (
        <Layout>
          <ReconnectBanner status="reconnecting" />
          <div className="flex items-center justify-center py-20">
            <span className="text-foreground-dim text-sm">{t("common.reconnecting")}</span>
          </div>
        </Layout>
      );
    }
    if (reconnectStatus === "failed") {
      return <Layout><ReconnectBanner status="failed" /></Layout>;
    }
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <span className="text-foreground-dim text-sm">{t("common.loading")}</span>
        </div>
      </Layout>
    );
  }

  const status = room.status;
  const selectedGameId = room.selectedGame;
  const gameRegistration = selectedGameId ? getGame(selectedGameId) : null;

  return (
    <Layout>
      {showReconnectBanner && (
        <ReconnectBanner status={reconnectStatus as "reconnecting" | "failed"} />
      )}

      <div className="flex flex-col gap-5 sm:gap-6">
        {/* Header */}
        <div className="relative flex items-start justify-center pt-2">
          <button
            onClick={handleLeave}
            className="absolute left-0 top-2 rounded-lg bg-danger/10 text-danger px-3 py-1.5 text-[10px] sm:text-xs font-medium hover:bg-danger/20 transition-all border border-danger/20 cursor-pointer"
          >
            {t("common.leave")}
          </button>
          <RoomCode code={room.code} />
        </div>

        {/* ═══ WAITING ═══ */}
        {status === "WAITING" && (
          <div className="flex flex-col gap-5 sm:gap-6">
            <p className="text-center text-xs sm:text-sm text-foreground-muted">{t("room.waiting")}</p>

            <PlayerList
              players={room.players}
              currentPlayerId={myPlayerId}
              isAdmin={isAdmin}
              onKick={handleKick}
              onTransfer={handleTransfer}
            />

            {isAdmin && (
              <div className="w-full card-raised p-4 sm:p-5 space-y-4">
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-accent tracking-wide">{t("common.admin")}</h2>
                  <div className="h-px w-10 mt-2 bg-accent/30" />
                </div>
                <AddOfflinePlayerInline />
                <Button onClick={handleLockRoom}>{t("room.lock")}</Button>
              </div>
            )}

            {!isAdmin && (
              <p className="text-center text-xs text-foreground-dim">{t("admin.waitingForAdmin")}</p>
            )}
          </div>
        )}

        {/* ═══ LOCKED — Game Selection ═══ */}
        {status === "LOCKED" && (
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="text-center space-y-1">
              <p className="text-xs sm:text-sm text-accent font-bold">{t("room.selectGame")}</p>
              <p className="text-[10px] sm:text-xs text-foreground-dim">{t("room.locked")}</p>
            </div>

            <div className="flex justify-center">
              <span className="text-xs text-foreground-muted bg-surface-raised border border-border-visible rounded-full px-4 py-1.5">
                <span className="font-mono text-accent">{room.players.length}</span> {t("common.players")}
              </span>
            </div>

            <GamePicker
              selectedGameId={selectedGameId}
              onSelect={handleSelectGame}
              isAdmin={isAdmin}
            />

            {isAdmin && selectedGameId && (
              <div className="space-y-3">
                {/* Game-specific lobby config */}
                {gameRegistration?.LobbyConfig && (
                  <gameRegistration.LobbyConfig room={room} isAdmin={isAdmin} />
                )}

                <Button onClick={handleStartGame}>{t("room.startGame")}</Button>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={handleUnlockRoom}
                className="w-full h-10 rounded-xl border border-border-visible text-foreground-muted text-xs sm:text-sm font-medium hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
              >
                {t("room.unlock")}
              </button>
            )}

            {!isAdmin && (
              <p className="text-center text-xs text-foreground-dim">{t("admin.waitingForAdmin")}</p>
            )}
          </div>
        )}

        {/* ═══ PLAYING — Render Game Plugin ═══ */}
        {status === "PLAYING" && gameRegistration && (
          <div className="flex flex-col gap-5">
            <gameRegistration.GameComponent
              room={room}
              myPlayerId={myPlayerId}
              isAdmin={isAdmin}
            />
            {isAdmin && (
              <Button variant="danger" onClick={handleStopGame}>
                {t("room.stopGame")}
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AddOfflinePlayerInline() {
  const [playerName, setPlayerName] = useState("");
  const emit = useSocketEmit();
  const { t } = useTranslation();

  const handleAdd = useCallback(() => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    emit(ClientEvents.ADD_OFFLINE_PLAYER, { displayName: trimmed });
    setPlayerName("");
  }, [playerName, emit]);

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] sm:text-xs font-bold text-foreground-muted tracking-wide uppercase">{t("admin.addOfflinePlayer")}</h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder={t("admin.playerName")}
          maxLength={20}
          autoComplete="off"
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="flex-1 bg-surface-raised border border-border-visible rounded-xl h-11 px-3 text-right text-sm text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"
        />
        <button
          onClick={handleAdd}
          disabled={!playerName.trim()}
          className="h-11 px-6 rounded-xl bg-accent text-background text-sm font-bold disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}
