import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { pool } from "./db/pool.js";
import { createDiscordClient } from "./discord/client.js";
import { startHealthServer } from "./health/server.js";

const client = createDiscordClient();
startHealthServer(client);

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Encerrando aplicação");
  client.destroy();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => logger.fatal({ error }, "Promise rejeitada sem tratamento"));
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Exceção não tratada");
  process.exit(1);
});

await client.login(env.discordToken);
