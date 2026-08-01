import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function bool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ["true", "1", "yes", "sim"].includes(value.toLowerCase());
}

function integer(name: string, fallback: number, min = 0): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${name} deve ser um inteiro >= ${min}`);
  }
  return parsed;
}

function decimal(name: string, fallback: number, min = 0, max = 1): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} deve estar entre ${min} e ${max}`);
  }
  return parsed;
}

function csv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
  allowedGuildIds: new Set(csv("ALLOWED_GUILD_IDS")),
  allowedChannelIds: new Set(csv("ALLOWED_CHANNEL_IDS")),
  enableReplyTrigger: bool("ENABLE_REPLY_TRIGGER", true),
  enableDirectMessages: bool("ENABLE_DIRECT_MESSAGES", false),

  openRouterApiKey: required("OPENROUTER_API_KEY"),
  openRouterModel: process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash",
  openRouterEmbeddingModel:
    process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small",
  embeddingDimensions: integer("EMBEDDING_DIMENSIONS", 1536, 1),
  openRouterSiteUrl: process.env.OPENROUTER_SITE_URL?.trim() || undefined,
  openRouterSiteName: process.env.OPENROUTER_SITE_NAME?.trim() || "Embaixador IA UNIPDS",
  denyDataCollection: bool("OPENROUTER_DENY_DATA_COLLECTION", true),

  databaseUrl: required("DATABASE_URL"),
  databaseSsl: bool("DATABASE_SSL", false),

  ragTopK: integer("RAG_TOP_K", 6, 1),
  ragMinScore: decimal("RAG_MIN_SCORE", 0.35),
  ragNamespaces: csv("RAG_NAMESPACES").length > 0 ? csv("RAG_NAMESPACES") : ["course", "ai", "programming"],
  chunkSize: integer("CHUNK_SIZE", 1200, 200),
  chunkOverlap: integer("CHUNK_OVERLAP", 180, 0),
  maxHistoryMessages: integer("MAX_HISTORY_MESSAGES", 8, 0),

  maxInputChars: integer("MAX_INPUT_CHARS", 6000, 100),
  maxOutputTokens: integer("MAX_OUTPUT_TOKENS", 1400, 100),
  userRateLimitPerMinute: integer("USER_RATE_LIMIT_PER_MINUTE", 8, 1),

  enableInputGuard: bool("ENABLE_INPUT_GUARD", true),
  enableLlmGuard: bool("ENABLE_LLM_GUARD", false),
  llmGuardModel: process.env.LLM_GUARD_MODEL?.trim() || "openai/gpt-oss-safeguard-20b",

  logLevel: process.env.LOG_LEVEL?.trim() || "info",
  port: integer("PORT", 3000, 1),

  roleEstrela: process.env.ROLE_ESTRELA?.trim() || undefined,
  roleTop3: process.env.ROLE_TOP3?.trim() || undefined,
  roleGenio: process.env.ROLE_GENIO?.trim() || undefined,
  roleMentor: process.env.ROLE_MENTOR?.trim() || undefined,
  roleDedicado: process.env.ROLE_DEDICADO?.trim() || undefined,
} as const;

if (env.chunkOverlap >= env.chunkSize) {
  throw new Error("CHUNK_OVERLAP deve ser menor que CHUNK_SIZE");
}

if (env.embeddingDimensions !== 1536) {
  throw new Error(
    "O schema SQL fornecido usa VECTOR(1536). Ajuste sql/001_init.sql antes de mudar EMBEDDING_DIMENSIONS.",
  );
}
