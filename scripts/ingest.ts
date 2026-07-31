import "dotenv/config";
import { createHash } from "node:crypto";
import path from "node:path";
import { env } from "../src/config/env.js";
import { logger } from "../src/config/logger.js";
import { pool } from "../src/db/pool.js";
import { chunkText } from "../src/rag/chunking.js";
import { loadDocuments } from "../src/rag/loader.js";
import { OpenRouterEmbeddings } from "../src/rag/openrouter-embeddings.js";
import { replaceSourceChunks } from "../src/rag/vector-repository.js";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const namespace = argument("namespace");
const inputPath = argument("path");
if (!namespace || !inputPath) {
  throw new Error("Uso: npm run ingest -- --namespace course --path ./knowledge/course");
}
if (!/^[a-z0-9_-]{1,40}$/i.test(namespace)) {
  throw new Error("Namespace inválido");
}

const embeddings = new OpenRouterEmbeddings();
const documents = await loadDocuments(path.resolve(inputPath));
logger.info({ namespace, documents: documents.length }, "Iniciando ingestão");

try {
  for (const document of documents) {
    const sourceHash = createHash("sha256").update(document.content).digest("hex");
    const chunks = chunkText(document.content, env.chunkSize, env.chunkOverlap);
    const vectors: number[][] = [];
    const batchSize = 32;
    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize).map((chunk) => chunk.content);
      vectors.push(...(await embeddings.embedDocuments(batch)));
    }
    await replaceSourceChunks({
      namespace,
      source: document.source,
      sourceHash,
      chunks: chunks.map((chunk, index) => ({
        index: chunk.index,
        title: document.title,
        content: chunk.content,
        metadata: { ...document.metadata, namespace },
        embedding: vectors[index]!,
      })),
    });
    logger.info({ source: document.source, chunks: chunks.length }, "Documento indexado");
  }
} finally {
  await pool.end();
}
