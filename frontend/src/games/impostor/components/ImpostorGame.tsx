"use client";
import { useState, useCallback } from "react";
import { useSocketEmit, useSocketEvent } from "@/hooks/useSocketEvents";
import { useTranslation } from "@/i18n/context";
import { ImpostorEvents, type AdminMode, type ImpostorRoleAssignedPayload, type ImpostorPhaseChangedPayload, type ImpostorVoteStatePayload, type ImpostorRoundResultPayload, type ImpostorGameState, type ImpostorTurnUpdatedPayload, type ImpostorVoteRequestsPayload } from "@/lib/api-types";
import { ImpostorProvider, useImpostor } from "../store/impostorStore";
import type { GameComponentProps } from "../../types";
import Button from "@/components/shared/Button";
import { cn } from "@/utils/rtl";

function ImpostorGameInner({ room, myPlayerId, isAdmin }: GameComponentProps) {
  const { t } = useTranslation();
  const emit = useSocketEmit();
  const { role, word, setRole, clearRole } = useImpostor();
  const [loading, setLoading] = useState(false);
  const [voteState, setVoteState] = useState<{ totalEligible: number; votedCount: number }>({ totalEligible: 0, votedCount: 0 });
  const [roundResult, setRoundResult] = useState<ImpostorRoundResultPayload | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [turnState, setTurnState] = useState<ImpostorTurnUpdatedPayload | null>(null);
  const [voteRequests, setVoteRequests] = useState<string[]>([]);
  const [hasRequestedVote, setHasRequestedVote] = useState(false);

  const gameState = room.gameState as ImpostorGameState | null;
  const phase = gameState?.phase || "CHOOSING";

  // Listen for impostor game events
  useSocketEvent<ImpostorRoleAssignedPayload>(ImpostorEvents.ROLE_ASSIGNED, (data) => {
    setRole(data.role, data.word);
    setHasVoted(false);
    setSelectedTarget(null);
    setRoundResult(null);
    setHasRequestedVote(false);
    setVoteRequests([]);
    setTurnState(null);
  });

  // Handle game_player_data (sent on reconnect / game start recovery)
  useSocketEvent<{ data: ImpostorRoleAssignedPayload }>("game_player_data", (payload) => {
    if (payload.data?.role) {
      setRole(payload.data.role, payload.data.word);
    }
  });

  useSocketEvent<ImpostorPhaseChangedPayload>(ImpostorEvents.PHASE_CHANGED, (data) => {
    setLoading(false);
    if (data.phase === "CHOOSING") {
      clearRole();
      setHasVoted(false);
      setRoundResult(null);
      setTurnState(null);
      setVoteRequests([]);
      setHasRequestedVote(false);
    }
  });

  useSocketEvent<ImpostorVoteStatePayload>(ImpostorEvents.VOTE_STATE_UPDATED, (data) => {
    setVoteState({ totalEligible: data.totalEligible, votedCount: data.votedCount });
  });

  useSocketEvent<ImpostorRoundResultPayload>(ImpostorEvents.ROUND_RESULT, (data) => {
    setRoundResult(data);
  });

  useSocketEvent<ImpostorTurnUpdatedPayload>(ImpostorEvents.TURN_UPDATED, (data) => {
    setTurnState(data);
  });

  useSocketEvent<ImpostorVoteRequestsPayload>(ImpostorEvents.VOTE_REQUESTS_UPDATED, (data) => {
    setVoteRequests(data.playerIds);
    if (data.playerIds.includes(myPlayerId)) {
      setHasRequestedVote(true);
    }
  });

  const handleAction = useCallback((event: string, payload?: Record<string, unknown>) => {
    setLoading(true);
    emit(event, payload);
    setTimeout(() => setLoading(false), 2000);
  }, [emit]);

  const handleVote = useCallback((targetId: string) => {
    emit(ImpostorEvents.SUBMIT_VOTE, { targetPlayerId: targetId });
    setHasVoted(true);
    setSelectedTarget(null);
  }, [emit]);

  const handleRequestVote = useCallback(() => {
    emit(ImpostorEvents.REQUEST_VOTE);
    setHasRequestedVote(true);
  }, [emit]);

  const players = room.players;
  const eligibleTargets = players.filter((p) => p.id !== myPlayerId);

  const adminMode: AdminMode = gameState?.adminMode || "ADMIN_PLAYER";

  const handleSetAdminMode = useCallback((mode: AdminMode) => {
    emit(ImpostorEvents.SET_ADMIN_MODE, { adminMode: mode });
  }, [emit]);

  // ── CHOOSING phase ──
  if (phase === "CHOOSING") {
    return (
      <div className="w-full space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-accent">{t("impostor.phase.CHOOSING")}</h2>
          {gameState?.words && (
            <p className="text-foreground-muted text-sm">{t("impostor.wordsCount", { count: gameState.words.length })}</p>
          )}
        </div>

        {isAdmin && (
          <div className="space-y-5">
            {/* Admin mode selection */}
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground-muted mb-3">
                {t("create.adminPlayer").split(" ")[0]}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSetAdminMode("ADMIN_PLAYER")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-5 transition-all duration-300 cursor-pointer",
                    adminMode === "ADMIN_PLAYER"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-visible text-foreground-muted hover:border-accent/30"
                  )}
                >
                  <span className="font-bold text-sm">{t("create.adminPlayer")}</span>
                  <span className="text-[10px] opacity-60">{t("create.adminPlayerDesc")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAdminMode("ADMIN_ONLY")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-4 py-5 transition-all duration-300 cursor-pointer",
                    adminMode === "ADMIN_ONLY"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-visible text-foreground-muted hover:border-accent/30"
                  )}
                >
                  <span className="font-bold text-sm">{t("create.adminOnly")}</span>
                  <span className="text-[10px] opacity-60">{t("create.adminOnlyDesc")}</span>
                </button>
              </div>
            </div>

            <Button onClick={() => handleAction(ImpostorEvents.START_ROUND)} loading={loading}>
              {t("impostor.startRound")}
            </Button>
          </div>
        )}

        {!isAdmin && (
          <div className="text-center py-8">
            <span className="text-foreground-muted text-sm">{t("admin.waitingForAdmin")}</span>
          </div>
        )}
      </div>
    );
  }

  // ── ROLE_REVEAL phase ──
  if (phase === "ROLE_REVEAL") {
    return (
      <div className="w-full space-y-6">
        {role === null && (
          <div className="card-raised p-10 text-center animate-fade-up">
            <p className="text-lg text-foreground-muted">{t("admin.waitingForAdmin")}</p>
          </div>
        )}
        {role === "impostor" && (
          <div className="relative bg-danger-surface border-2 border-danger/30 rounded-2xl p-10 text-center w-full animate-fade-up pulse-danger">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center">
              <span className="text-danger text-3xl font-bold">؟</span>
            </div>
            <p className="text-4xl font-bold text-danger">{t("impostor.youAreImpostor")}</p>
            <p className="text-danger/60 mt-3 text-sm">{t("impostor.nobodyKnows")}</p>
          </div>
        )}
        {role === "normal" && word && (
          <div className="relative bg-surface border-2 border-accent/20 rounded-2xl p-10 text-center w-full animate-fade-up glow-accent">
            <p className="text-sm text-foreground-muted mb-4 tracking-wide">{t("impostor.yourWord")}</p>
            <div className="h-px w-12 mx-auto mb-5 bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
            <p className="text-5xl font-bold text-accent leading-tight">{word}</p>
          </div>
        )}
        {isAdmin && (
          <Button onClick={() => handleAction(ImpostorEvents.ADVANCE_PHASE)} loading={loading}>
            {t("impostor.nextStructuredRound")}
          </Button>
        )}
      </div>
    );
  }

  // ── Shared turn data (used by both STRUCTURED_ROUND and FREE_ROUND) ──
  const currentRound = gameState?.currentRound;
  const turnOrder = turnState?.turnOrder ?? currentRound?.turnOrder ?? [];
  const currentTurnIndex = turnState?.currentTurnIndex ?? currentRound?.currentTurnIndex ?? 0;
  const askedPlayerIds = turnState?.askedPlayerIds ?? currentRound?.askedPlayerIds ?? [];
  const allTurnsDone = turnState?.allTurnsDone ?? (currentTurnIndex >= turnOrder.length);

  // Circle pattern: player[i] asks player[(i+1) % length]
  const getAskerName = (index: number) => players.find((p) => p.id === turnOrder[index])?.displayName ?? "";
  const getAnswererName = (index: number) => players.find((p) => p.id === turnOrder[(index + 1) % turnOrder.length])?.displayName ?? "";

  // ── STRUCTURED_ROUND phase ──
  if (phase === "STRUCTURED_ROUND") {
    const currentAskerName = !allTurnsDone ? getAskerName(currentTurnIndex) : null;
    const currentAnswererName = !allTurnsDone ? getAnswererName(currentTurnIndex) : null;

    return (
      <div className="w-full space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-accent">{t("impostor.phase.STRUCTURED_ROUND")}</h2>
          <p className="text-foreground-muted text-sm">{t("impostor.structuredInfo")}</p>
          {!allTurnsDone && (
            <p className="text-foreground-muted text-xs">
              {t("impostor.turnProgress", { current: currentTurnIndex + 1, total: turnOrder.length })}
            </p>
          )}
        </div>

        {/* Current asker → answerer highlight */}
        {currentAskerName && currentAnswererName && !allTurnsDone && (
          <div className="card-raised border-accent/20 p-5 text-center">
            <p className="text-lg font-bold text-accent">
              {t("impostor.askTurn", { asker: currentAskerName, answerer: currentAnswererName })}
            </p>
          </div>
        )}

        {allTurnsDone && (
          <div className="card-raised border-success/20 p-5 text-center">
            <p className="text-lg font-bold text-success">{t("impostor.allTurnsDone")}</p>
          </div>
        )}

        {/* Turn order list — shows asker → answerer pairs */}
        <div className="card divide-y divide-border">
          {turnOrder.map((playerId, index) => {
            const player = players.find((p) => p.id === playerId);
            const answerer = players.find((p) => p.id === turnOrder[(index + 1) % turnOrder.length]);
            if (!player) return null;
            const isDone = askedPlayerIds.includes(playerId);
            const isCurrent = index === currentTurnIndex && !allTurnsDone;

            return (
              <div key={playerId} className={cn(
                "flex items-center gap-3 py-3 px-4 transition-all duration-300",
                isCurrent && "bg-accent/5"
              )}>
                <span className={cn(
                  "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border",
                  isDone ? "bg-success/15 border-success/30 text-success" :
                  isCurrent ? "bg-accent/15 border-accent/30 text-accent" :
                  "bg-surface-raised border-border text-foreground-dim"
                )}>
                  {isDone ? "✓" : index + 1}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={cn(
                    "font-bold text-sm",
                    isCurrent && "text-accent"
                  )}>{player.displayName}</span>
                  <span className="text-foreground-dim text-xs">{t("impostor.asks")}</span>
                  <span className={cn(
                    "text-sm",
                    isCurrent ? "text-accent/70" : "text-foreground-muted"
                  )}>{answerer?.displayName}</span>
                </div>
                {(playerId === myPlayerId) && (
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20 ms-auto flex-shrink-0">
                    {t("common.you")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Word reminder */}
        {role === "normal" && word && (
          <div className="card p-4 text-center">
            <span className="text-foreground-muted text-xs">{t("impostor.yourWord")}: </span>
            <span className="font-bold text-accent">{word}</span>
          </div>
        )}

        {/* Vote request indicator */}
        <VoteRequestIndicator voteRequests={voteRequests} players={players} />

        {/* Player actions */}
        {!hasRequestedVote && (
          <Button variant="secondary" onClick={handleRequestVote}>
            {t("impostor.requestVote")}
          </Button>
        )}
        {hasRequestedVote && (
          <div className="text-center text-sm text-foreground-muted">{t("impostor.voteRequested")}</div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="space-y-3">
            {!allTurnsDone && (
              <Button onClick={() => handleAction(ImpostorEvents.MARK_TURN_DONE)} loading={loading}>
                {t("impostor.markTurnDone")}
              </Button>
            )}
            {allTurnsDone && (
              <Button onClick={() => handleAction(ImpostorEvents.ADVANCE_PHASE)} loading={loading}>
                {t("impostor.nextFreeRound")}
              </Button>
            )}
            <Button variant="danger" onClick={() => handleAction(ImpostorEvents.ADVANCE_PHASE, { skipToVoting: true })} loading={loading}>
              {t("impostor.startVoting")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── FREE_ROUND phase ──
  if (phase === "FREE_ROUND") {
    const freeCurrentAskerId = !allTurnsDone ? turnOrder[currentTurnIndex] : null;
    const freeCurrentAskerName = freeCurrentAskerId ? players.find((p) => p.id === freeCurrentAskerId)?.displayName : null;

    return (
      <div className="w-full space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-accent">{t("impostor.phase.FREE_ROUND")}</h2>
          <p className="text-foreground-muted text-sm">{t("impostor.freeDiscussion")}</p>
          {!allTurnsDone && (
            <p className="text-foreground-muted text-xs">
              {t("impostor.turnProgress", { current: currentTurnIndex + 1, total: turnOrder.length })}
            </p>
          )}
        </div>

        {/* Current asker highlight — can ask anyone */}
        {freeCurrentAskerName && !allTurnsDone && (
          <div className="card-raised border-accent/20 p-5 text-center">
            <p className="text-lg font-bold text-accent">{t("impostor.freeTurn", { name: freeCurrentAskerName })}</p>
          </div>
        )}

        {allTurnsDone && (
          <div className="card-raised border-success/20 p-5 text-center">
            <p className="text-lg font-bold text-success">{t("impostor.allTurnsDone")}</p>
          </div>
        )}

        {/* Turn queue — same order, current highlighted, no predetermined answerer */}
        <div className="card divide-y divide-border">
          {turnOrder.map((playerId, index) => {
            const player = players.find((p) => p.id === playerId);
            if (!player) return null;
            const isDone = askedPlayerIds.includes(playerId);
            const isCurrent = index === currentTurnIndex && !allTurnsDone;

            return (
              <div key={playerId} className={cn(
                "flex items-center gap-3 py-3 px-4 transition-all duration-300",
                isCurrent && "bg-accent/5"
              )}>
                <span className={cn(
                  "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border",
                  isDone ? "bg-success/15 border-success/30 text-success" :
                  isCurrent ? "bg-accent/15 border-accent/30 text-accent" :
                  "bg-surface-raised border-border text-foreground-dim"
                )}>
                  {isDone ? "✓" : index + 1}
                </span>
                <span className={cn(
                  "font-medium text-sm",
                  isCurrent && "text-accent"
                )}>{player.displayName}</span>
                {playerId === myPlayerId && (
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20 ms-auto flex-shrink-0">
                    {t("common.you")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Word reminder */}
        {role === "normal" && word && (
          <div className="card p-4 text-center">
            <span className="text-foreground-muted text-xs">{t("impostor.yourWord")}: </span>
            <span className="font-bold text-accent">{word}</span>
          </div>
        )}

        {/* Vote request indicator */}
        <VoteRequestIndicator voteRequests={voteRequests} players={players} />

        {/* Player actions */}
        {!hasRequestedVote && (
          <Button variant="secondary" onClick={handleRequestVote}>
            {t("impostor.requestVote")}
          </Button>
        )}
        {hasRequestedVote && (
          <div className="text-center text-sm text-foreground-muted">{t("impostor.voteRequested")}</div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="space-y-3">
            {!allTurnsDone && (
              <Button onClick={() => handleAction(ImpostorEvents.MARK_TURN_DONE)} loading={loading}>
                {t("impostor.markTurnDone")}
              </Button>
            )}
            <Button variant="danger" onClick={() => handleAction(ImpostorEvents.ADVANCE_PHASE, { skipToVoting: true })} loading={loading}>
              {t("impostor.startVoting")}
            </Button>
            <Button variant="secondary" onClick={() => handleAction(ImpostorEvents.RESTART_FREE_ROUND)} loading={loading}>
              {t("impostor.repeatFreeRound")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── VOTING phase ──
  if (phase === "VOTING") {
    if (hasVoted) {
      return (
        <div className="w-full space-y-6 animate-fade-up">
          <div className="card p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center">
              <span className="text-accent text-xl">&#10003;</span>
            </div>
            <h2 className="text-xl font-bold text-accent">{t("impostor.voted")}</h2>
            <p className="text-foreground-muted mt-3 text-sm">{t("impostor.waitingForVotes")}</p>
          </div>
          <VoteProgress totalEligible={voteState.totalEligible} votedCount={voteState.votedCount} />
        </div>
      );
    }

    return (
      <div className="w-full space-y-6 animate-fade-up">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-accent mb-1">{t("impostor.votingPhase")}</h2>
          <p className="text-foreground-muted text-sm">{t("impostor.voteFor")}</p>
        </div>
        {selectedTarget && (
          <div className="card-raised border-accent/20 p-6 text-center space-y-4">
            <p className="text-lg font-semibold">
              {players.find(p => p.id === selectedTarget)?.displayName}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleVote(selectedTarget)}>{t("common.confirm")}</Button>
              <Button variant="secondary" onClick={() => setSelectedTarget(null)}>{t("common.cancel")}</Button>
            </div>
          </div>
        )}
        {!selectedTarget && (
          <div className="w-full space-y-2 stagger">
            {eligibleTargets.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 bg-surface border-border-visible hover:border-accent/30 hover:bg-accent-glow active:scale-[0.98] cursor-pointer"
              >
                <span className="font-medium text-sm">{player.displayName}</span>
                <span className="text-foreground-dim text-xs">
                  {player.isConnected ? t("common.online") : t("common.offline")}
                </span>
              </button>
            ))}
          </div>
        )}
        <VoteProgress totalEligible={voteState.totalEligible} votedCount={voteState.votedCount} />
      </div>
    );
  }

  // ── RESULT phase ──
  if (phase === "RESULT" && roundResult) {
    const tallyEntries = Object.entries(roundResult.voteTally)
      .map(([playerId, count]) => ({
        playerId,
        displayName: players.find(p => p.id === playerId)?.displayName ?? playerId,
        count,
        isImpostor: playerId === roundResult.impostorId,
      }))
      .sort((a, b) => b.count - a.count);

    return (
      <div className="w-full space-y-6 stagger">
        <div className={cn(
          "rounded-2xl p-10 text-center border-2 animate-fade-up",
          roundResult.impostorCaught ? "bg-success-surface border-success/30" : "bg-danger-surface border-danger/30 pulse-danger"
        )}>
          <h2 className={cn("text-3xl font-bold", roundResult.impostorCaught ? "text-success" : "text-danger")}>
            {roundResult.impostorCaught ? t("impostor.impostorCaught") : t("impostor.impostorEscaped")}
          </h2>
        </div>
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted text-sm">{t("impostor.impostorWas")}</span>
            <span className="font-bold text-danger">{roundResult.impostorName}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted text-sm">{t("impostor.theWordWas")}</span>
            <span className="font-bold text-accent">{roundResult.word}</span>
          </div>
        </div>
        {tallyEntries.length > 0 && (
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground-muted text-center tracking-wide">{t("impostor.votes")}</h3>
            <div className="space-y-2">
              {tallyEntries.map((entry) => (
                <div key={entry.playerId} className={cn(
                  "flex items-center justify-between p-3 rounded-xl",
                  entry.isImpostor ? "bg-danger-surface border border-danger/20" : "bg-surface-raised"
                )}>
                  <span className={cn("font-medium text-sm", entry.isImpostor && "text-danger")}>{entry.displayName}</span>
                  <span className={cn("font-bold text-lg", entry.isImpostor ? "text-danger" : "text-accent")}>{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isAdmin && (
          <div className="space-y-3">
            <Button onClick={() => handleAction(ImpostorEvents.ADVANCE_PHASE)} loading={loading}>
              {t("impostor.newRound")}
            </Button>
            <Button variant="danger" onClick={() => {
              if (!window.confirm(t("impostor.stopConfirm"))) return;
              emit("stop_game");
            }}>
              {t("impostor.stopGame")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <span className="text-foreground-muted">{t("common.loading")}</span>
    </div>
  );
}

function VoteRequestIndicator({ voteRequests, players }: { voteRequests: string[]; players: Array<{ id: string; displayName: string }> }) {
  const { t } = useTranslation();
  if (voteRequests.length === 0) return null;

  const requestNames = voteRequests
    .map((id) => players.find((p) => p.id === id)?.displayName)
    .filter(Boolean);

  return (
    <div className="card border-accent/20 bg-accent/5 p-4 text-center space-y-2">
      <p className="text-sm font-bold text-accent">
        {t("impostor.voteRequestCount", { count: voteRequests.length })}
      </p>
      <p className="text-xs text-foreground-muted">{requestNames.join(" · ")}</p>
    </div>
  );
}

function VoteProgress({ totalEligible, votedCount }: { totalEligible: number; votedCount: number }) {
  const { t } = useTranslation();
  if (totalEligible === 0) return null;
  const pct = Math.round((votedCount / totalEligible) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>{t("impostor.votesProgress", { voted: votedCount, total: totalEligible })}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ImpostorGame(props: GameComponentProps) {
  return (
    <ImpostorProvider>
      <ImpostorGameInner {...props} />
    </ImpostorProvider>
  );
}
