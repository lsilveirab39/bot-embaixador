import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { pool } from "./db/pool.js";
import { createDiscordClient } from "./discord/client.js";
import { startHealthServer } from "./health/server.js";
import { checkAndAssignRoles } from "./game/roles.js";

const client = createDiscordClient();
startHealthServer(client);

const DAILY_CHECK_HOURS = [10, 12, 17, 19, 20, 21];

function calculateDelayToHour(targetHour: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(targetHour, 0, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function scheduleDailyRoleCheck(): void {
  const randomHour = DAILY_CHECK_HOURS[Math.floor(Math.random() * DAILY_CHECK_HOURS.length)]!;
  const delay = calculateDelayToHour(randomHour);

  logger.info(
    { nextCheck: new Date(Date.now() + delay).toISOString(), hour: randomHour },
    "Verificação diária de cargos agendada",
  );

  setTimeout(async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const results = await checkAndAssignRoles(client, guild.id);
        if (results.length > 0) {
          logger.info({ guildId: guild.id, awarded: results.length }, "Cargos atribuídos na verificação diária");
        }
      }
    } catch (error) {
      logger.error({ error }, "Erro na verificação diária de cargos");
    }
    scheduleDailyRoleCheck();
  }, delay);
}

client.once("ready", () => {
  scheduleDailyRoleCheck();
});

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
