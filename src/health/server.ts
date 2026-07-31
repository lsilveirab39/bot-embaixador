import { createServer } from "node:http";
import type { Client } from "discord.js";
import { env } from "../config/env.js";
import { checkDatabase } from "../db/pool.js";

export function startHealthServer(client: Client): void {
  createServer(async (request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (request.url === "/ready") {
      const database = await checkDatabase();
      const discord = client.isReady();
      const ready = database && discord;
      response.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: ready ? "ready" : "not_ready", database, discord }));
      return;
    }
    response.writeHead(404).end();
  }).listen(env.port);
}
