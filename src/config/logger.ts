import pino from "pino";
import { env } from "./env.js";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino(
  {
    level: env.logLevel,
    redact: {
      paths: [
        "discordToken",
        "openRouterApiKey",
        "req.headers.authorization",
        "*.token",
        "*.apiKey",
      ],
      censor: "[REDACTED]",
    },
  },
  isProduction
    ? process.stdout
    : pino.multistream([
        { stream: pino.destination("bot.log") },
        { stream: process.stdout },
      ]),
);
