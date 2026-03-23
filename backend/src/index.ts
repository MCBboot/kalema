import "dotenv/config";
import { httpServer, io } from "./server.js";
import { PORT } from "./config/env.js";
import { logInfo, logError } from "./utils/logger.js";
import { registerGame } from "./games/registry.js";
import { impostorGame, initImpostorGame } from "./games/impostor/index.js";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";
import { startCleanupJob } from "./jobs/cleanupJob.js";

// Register games
try {
  initImpostorGame();
  registerGame(impostorGame);
  logInfo("Startup", "Impostor game registered successfully");
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  logError("Startup", `Failed to register impostor game: ${message}`);
  process.exit(1);
}

registerSocketHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  logInfo("Server", `Kalema backend started on port ${PORT}`);
  startCleanupJob();
  logInfo("Startup", "Cleanup job started");
});
