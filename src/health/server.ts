import { createServer } from "node:http";
import type { Client } from "discord.js";
import { env } from "../config/env.js";
import { checkDatabase } from "../db/pool.js";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function startHealthServer(client: Client): void {
  createServer(async (request, response) => {
    if (request.method !== "GET") {
      response.writeHead(405, SECURITY_HEADERS);
      response.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json", ...SECURITY_HEADERS });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (request.url === "/ready") {
      const database = await checkDatabase();
      const discord = client.isReady();
      const ready = database && discord;
      response.writeHead(ready ? 200 : 503, { "content-type": "application/json", ...SECURITY_HEADERS });
      response.end(JSON.stringify({ status: ready ? "ready" : "not_ready", database, discord }));
      return;
    }
    response.writeHead(404, SECURITY_HEADERS).end();
  }).listen(env.port);
}
