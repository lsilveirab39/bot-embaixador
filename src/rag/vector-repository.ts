import { createHash, randomUUID } from "node:crypto";
import { pool } from "../db/pool.js";
import type { RetrievedChunk } from "../types/domain.js";
import { pseudonymize } from "../utils/crypto.js";
import { OpenRouterEmbeddings } from "./openrouter-embeddings.js";

const embeddings = new OpenRouterEmbeddings();

function toVectorLiteral(vector: number[]): string {
  if (vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contém valor não finito");
  }
  return `[${vector.join(",")}]`;
}

export async function searchKnowledge(input: {
  embedding: number[];
  namespaces: string[];
  topK: number;
  minScore: number;
}): Promise<RetrievedChunk[]> {
  const result = await pool.query(
    `SELECT id, namespace, source, title, content, metadata,
            1 - (embedding <=> $1::vector) AS score
       FROM knowledge_chunks
      WHERE namespace = ANY($2::text[])
        AND (1 - (embedding <=> $1::vector)) >= $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4`,
    [toVectorLiteral(input.embedding), input.namespaces, input.minScore, input.topK],
  );

  return result.rows.map((row) => ({
    id: row.id,
    namespace: row.namespace,
    source: row.source,
    title: row.title,
    content: row.content,
    score: Number(row.score),
    metadata: row.metadata ?? {},
  }));
}

export async function replaceSourceChunks(input: {
  namespace: string;
  source: string;
  sourceHash: string;
  chunks: Array<{
    index: number;
    title: string | null;
    content: string;
    metadata: Record<string, unknown>;
    embedding: number[];
  }>;
}): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM knowledge_chunks WHERE namespace = $1 AND source = $2",
      [input.namespace, input.source],
    );
    for (const chunk of input.chunks) {
      await client.query(
        `INSERT INTO knowledge_chunks
          (id, namespace, source, source_hash, chunk_index, title, content, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::vector)`,
        [
          randomUUID(),
          input.namespace,
          input.source,
          input.sourceHash,
          chunk.index,
          chunk.title,
          chunk.content,
          JSON.stringify(chunk.metadata),
          toVectorLiteral(chunk.embedding),
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function storeSolution(input: {
  question: string;
  compactContent: string;
  userId: string;
  channelId: string;
}): Promise<string> {
  const embedding = await embeddings.embedQuery(input.question);
  const id = randomUUID();
  const sourceHash = createHash("sha256")
    .update(input.question)
    .digest("hex")
    .slice(0, 16);

  await pool.query(
    `INSERT INTO knowledge_chunks
       (id, namespace, source, source_hash, chunk_index, title, content, metadata, embedding)
     VALUES ($1, 'solutions', 'feedback', $2, 0, $3, $4, $5::jsonb, $6::vector)
     ON CONFLICT (namespace, source, source_hash, chunk_index) DO NOTHING`,
    [
      id,
      sourceHash,
      input.question.slice(0, 200),
      input.compactContent,
      JSON.stringify({
        solvedBy: pseudonymize(input.userId),
        channelId: pseudonymize(input.channelId),
        usageCount: 0,
      }),
      toVectorLiteral(embedding),
    ],
  );

  return id;
}
