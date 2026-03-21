import "dotenv/config";
import { httpServer, io } from "./server.js";
import { PORT } from "./config/env.js";
import { logInfo, logError } from "./utils/logger.js";
import { loadDefaultWords } from "./services/wordService.js";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";
import { startCleanupJob } from "./jobs/cleanupJob.js";

try {
  loadDefaultWords();
  logInfo("Startup", "Default words loaded successfully");
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  logError("Startup", `Failed to load default words: ${message}`);
  process.exit(1);
}

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  logInfo("Server", `Kalema backend started on port ${PORT}`);
  startCleanupJob();
  logInfo("Startup", "Cleanup job started");
});
