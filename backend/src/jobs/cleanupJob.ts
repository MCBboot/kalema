import { CLEANUP_INTERVAL_MS, ROOM_INACTIVITY_TIMEOUT_MS } from "../config/constants.js";
import { cleanExpiredTokens } from "../services/reconnectService.js";
import { getAllRooms, deleteRoom } from "../store/memoryStore.js";
import { logInfo } from "../utils/logger.js";

export function startCleanupJob(): NodeJS.Timeout {
  const handle = setInterval(() => {
    const expiredCount = cleanExpiredTokens();
    if (expiredCount > 0) {
      logInfo("Cleanup", `Removed ${expiredCount} expired reconnect tokens`);
    }

    const rooms = getAllRooms();
    const now = Date.now();

    for (const [roomId, room] of rooms) {
      const hasConnectedPlayers = room.players.some(
        (p) => p.isConnected && p.type === "ONLINE",
      );

      if (!hasConnectedPlayers && now - room.updatedAt > ROOM_INACTIVITY_TIMEOUT_MS) {
        deleteRoom(roomId);
        logInfo("Cleanup", `Removed inactive room ${room.code} (${roomId})`);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  return handle;
}

export function stopCleanupJob(handle: NodeJS.Timeout): void {
  clearInterval(handle);
}
