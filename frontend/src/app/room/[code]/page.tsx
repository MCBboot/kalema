"use client";
import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/shared/Layout";
import RoomCode from "@/components/room/RoomCode";
import PlayerList from "@/components/room/PlayerList";
import AdminPanel from "@/components/admin/AdminPanel";
import PhaseIndicator from "@/components/game/PhaseIndicator";
import RoleReveal from "@/components/game/RoleReveal";
import Discussion from "@/components/game/Discussion";
import GameControls from "@/components/game/GameControls";
import VotingScreen from "@/components/game/VotingScreen";
import ResultScreen from "@/components/game/ResultScreen";
import OfflineVoting from "@/components/admin/OfflineVoting";
import ReconnectBanner from "@/components/shared/ReconnectBanner";
import { useRoom } from "@/store/roomStore";
import { usePlayer } from "@/store/playerStore";
import { useSecret } from "@/store/secretStore";
import { useConnection } from "@/store/connectionStore";
import { useSocketEvent, useSocketEmit } from "@/hooks/useSocketEvents";
import {
  useReconnect,
  storeReconnectData,
  clearReconnectData,
  getStoredReconnectToken,
} from "@/hooks/useReconnect";
import { connectSocket } from "@/lib/socket";
import {
  ClientEvents,
  ServerEvents,
  type Room,
  type Player,
  type RoleAssignedPayload,
  type RoomStatus,
  type VoteStatePayload,
  type RoundResultPayload,
} from "@/lib/api-types";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  const { room, setRoom, updatePlayers, updateRoomStatus, clearRoom } = useRoom();
  const { myPlayerId, isAdmin, setMyPlayer, clearPlayer } = usePlayer();
  const { setRole, clearRole } = useSecret();
  const { isConnected } = useConnection();
  const emit = useSocketEmit();

  // Voting and result state
  const [voteState, setVoteState] = useState<VoteStatePayload>({ totalEligible: 0, votedCount: 0 });
  const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);

  // Reconnect state
  const [reconnectStatus, setReconnectStatus] = useState<"idle" | "reconnecting" | "failed">("idle");
  const reconnectAttempted = useRef(false);

  // Store reconnect token when room_created or room_joined events arrive
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

  // Reconnect callbacks
  const { attemptReconnect } = useReconnect({
    onSessionRecovered: useCallback(
      (data) => {
        setRoom(data.room);
        setMyPlayer(data.playerId, data.displayName);
        if (data.role) {
          setRole(data.role.role, data.role.word);
        }
        setReconnectStatus("idle");
      },
      [setRoom, setMyPlayer, setRole]
    ),
    onReconnectFailed: useCallback(() => {
      setReconnectStatus("failed");
    }, []),
  });

  // Connect socket on mount if not connected
  useEffect(() => {
    connectSocket();
  }, []);

  // On mount or reconnect: attempt reconnect if we have a stored token and no room data
  useEffect(() => {
    if (reconnectAttempted.current) return;
    if (!isConnected) return;
    if (room && myPlayerId) return; // Already have state

    const token = getStoredReconnectToken(roomCode);
    if (token) {
      reconnectAttempted.current = true;
      setReconnectStatus("reconnecting");
      attemptReconnect(roomCode);
    }
  }, [isConnected, room, myPlayerId, roomCode, attemptReconnect]);

  // When socket reconnects after a disconnect, attempt session recovery
  useEffect(() => {
    if (!isConnected) return;
    if (reconnectStatus !== "reconnecting") return;

    const token = getStoredReconnectToken(roomCode);
    if (token) {
      attemptReconnect(roomCode);
    }
  }, [isConnected, reconnectStatus, roomCode, attemptReconnect]);

  // When socket disconnects and we have a token, show reconnecting banner
  useEffect(() => {
    if (!isConnected && room && myPlayerId) {
      const token = getStoredReconnectToken(roomCode);
      if (token) {
        setReconnectStatus("reconnecting");
      }
    }
  }, [isConnected, room, myPlayerId, roomCode]);

  // Redirect to home if no room/player data and no reconnect possibility
  useEffect(() => {
    if (!room && !myPlayerId && reconnectStatus === "idle") {
      const token = getStoredReconnectToken(roomCode);
      if (!token) {
        router.replace("/");
      }
    }
  }, [room, myPlayerId, reconnectStatus, roomCode, router]);

  // --- Leave room handler ---
  const handleLeave = useCallback(() => {
    emit(ClientEvents.LEAVE_ROOM);
    clearRoom();
    clearPlayer();
    clearRole();
    clearReconnectData(roomCode);
    router.replace("/");
  }, [emit, clearRoom, clearPlayer, clearRole, roomCode, router]);

  // --- Socket event listeners ---

  useSocketEvent<Room>(ServerEvents.ROOM_STATE_UPDATED, (data) => {
    setRoom(data);
  });

  useSocketEvent<{ players: Player[] }>(ServerEvents.PLAYER_LIST_UPDATED, (data) => {
    updatePlayers(data.players);
  });

  useSocketEvent<{ newAdminId: string }>(ServerEvents.ADMIN_CHANGED, (data) => {
    if (room) {
      const updatedPlayers = room.players.map((p) => ({
        ...p,
        isAdmin: p.id === data.newAdminId,
      }));
      setRoom({ ...room, adminPlayerId: data.newAdminId, players: updatedPlayers });
    }
  });

  useSocketEvent<{ playerId: string }>(ServerEvents.PLAYER_DISCONNECTED, (data) => {
    if (room) {
      const updatedPlayers = room.players.map((p) =>
        p.id === data.playerId ? { ...p, isConnected: false } : p
      );
      updatePlayers(updatedPlayers);
    }
  });

  useSocketEvent<{ playerId: string }>(ServerEvents.PLAYER_RECONNECTED, (data) => {
    if (room) {
      const updatedPlayers = room.players.map((p) =>
        p.id === data.playerId ? { ...p, isConnected: true } : p
      );
      updatePlayers(updatedPlayers);
    }
  });

  useSocketEvent<{ word: string; words: string[] }>(ServerEvents.WORD_ADDED, (data) => {
    if (room) {
      setRoom({ ...room, words: data.words });
    }
  });

  // Game events
  useSocketEvent<RoleAssignedPayload>(ServerEvents.ROLE_ASSIGNED, (data) => {
    setRole(data.role, data.word);
  });

  useSocketEvent<Room>(ServerEvents.GAME_STARTED, (data) => {
    setRoom(data);
    setVoteState({ totalEligible: 0, votedCount: 0 });
    setRoundResult(null);
  });

  useSocketEvent<{ phase: RoomStatus }>(ServerEvents.PHASE_CHANGED, (data) => {
    updateRoomStatus(data.phase);
  });

  useSocketEvent<VoteStatePayload>(ServerEvents.VOTE_STATE_UPDATED, (data) => {
    setVoteState(data);
  });

  useSocketEvent<RoundResultPayload>(ServerEvents.ROUND_RESULT, (data) => {
    setRoundResult(data);
  });

  useSocketEvent<Room>(ServerEvents.GAME_STOPPED, (_data) => {
    clearRole();
    setRoom(_data);
    setVoteState({ totalEligible: 0, votedCount: 0 });
    setRoundResult(null);
  });

  // --- Admin callbacks ---

  const handleKick = useCallback(
    (targetPlayerId: string) => {
      const player = room?.players.find((p) => p.id === targetPlayerId);
      if (!player) return;
      if (!window.confirm(`هل تريد طرد "${player.displayName}"؟`)) return;
      emit(ClientEvents.KICK_PLAYER, { targetPlayerId });
    },
    [room, emit]
  );

  const handleTransfer = useCallback(
    (targetPlayerId: string) => {
      const player = room?.players.find((p) => p.id === targetPlayerId);
      if (!player) return;
      if (!window.confirm(`هل تريد نقل الإدارة إلى "${player.displayName}"؟`)) return;
      emit(ClientEvents.TRANSFER_ADMIN, { targetPlayerId });
    },
    [room, emit]
  );

  // --- Reconnect banner ---
  const showReconnectBanner =
    reconnectStatus === "reconnecting" || reconnectStatus === "failed";

  // --- Loading state ---

  if (!room || !myPlayerId) {
    if (reconnectStatus === "reconnecting") {
      return (
        <Layout>
          <ReconnectBanner status="reconnecting" />
          <div className="flex items-center justify-center py-20">
            <span className="text-foreground/40">جاري إعادة الاتصال...</span>
          </div>
        </Layout>
      );
    }
    if (reconnectStatus === "failed") {
      return (
        <Layout>
          <ReconnectBanner status="failed" />
        </Layout>
      );
    }
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <span className="text-foreground/40">جاري التحميل...</span>
        </div>
      </Layout>
    );
  }

  const status = room.status;
  const isLobby = status === "WAITING" || status === "STOPPED";

  // --- Render ---

  return (
    <Layout>
      {showReconnectBanner && (
        <ReconnectBanner status={reconnectStatus as "reconnecting" | "failed"} />
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Header with room code and leave button */}
        <div className="w-full flex items-center justify-between">
          <div className="flex-1" />
          <RoomCode code={room.code} />
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLeave}
              className="rounded-lg bg-red-500/10 text-red-500 px-3 py-1.5 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
            >
              مغادرة
            </button>
          </div>
        </div>

        {/* Phase indicator (shown during active game) */}
        {!isLobby && <PhaseIndicator currentPhase={status} />}

        {/* Lobby view */}
        {isLobby && (
          <>
            <div className="w-full text-center">
              <span className="text-sm text-foreground/50">
                {status === "STOPPED" ? "اللعبة متوقفة" : "في انتظار بدء اللعبة"}
              </span>
            </div>

            <PlayerList
              players={room.players}
              currentPlayerId={myPlayerId}
              isAdmin={isAdmin}
              onKick={handleKick}
              onTransfer={handleTransfer}
            />

            <AdminPanel />

            <GameControls />
          </>
        )}

        {/* Role Reveal phase */}
        {status === "ROLE_REVEAL" && (
          <>
            <RoleReveal />
            <GameControls />
          </>
        )}

        {/* Discussion phase */}
        {status === "DISCUSSION" && (
          <>
            <Discussion />
            <GameControls />
          </>
        )}

        {/* Voting phase */}
        {status === "VOTING" && (
          <>
            <VotingScreen
              players={room.players}
              currentPlayerId={myPlayerId}
              isAdmin={isAdmin}
              totalEligible={voteState.totalEligible}
              votedCount={voteState.votedCount}
            />
            {isAdmin && (
              <OfflineVoting
                players={room.players}
                currentPlayerId={myPlayerId}
              />
            )}
            <GameControls />
          </>
        )}

        {/* Result phase */}
        {status === "RESULT" && (
          <>
            <ResultScreen result={roundResult} players={room.players} />
            <GameControls />
          </>
        )}
      </div>
    </Layout>
  );
}
