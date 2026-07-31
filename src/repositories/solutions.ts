import { pool } from "../db/pool.js";
import type { SolutionFeedback } from "../types/domain.js";
import { pseudonymize } from "../utils/crypto.js";

export async function getLastAssistantTurn(
  userId: string,
  channelId: string,
): Promise<string | null> {
  const result = await pool.query(
    `SELECT content FROM conversation_messages
      WHERE user_id = $1 AND channel_id = $2 AND role = 'assistant'
      ORDER BY created_at DESC LIMIT 1`,
    [pseudonymize(userId), pseudonymize(channelId)],
  );
  return result.rows[0]?.content ?? null;
}

export async function getLastUserTurn(
  userId: string,
  channelId: string,
): Promise<string | null> {
  const result = await pool.query(
    `SELECT content FROM conversation_messages
      WHERE user_id = $1 AND channel_id = $2 AND role = 'user'
      ORDER BY created_at DESC LIMIT 1`,
    [pseudonymize(userId), pseudonymize(channelId)],
  );
  return result.rows[0]?.content ?? null;
}

export async function getLastAssistantTurnBeforeMessage(
  userId: string,
  channelId: string,
  beforeMessageContent: string,
): Promise<string | null> {
  const hashUserId = pseudonymize(userId);
  const hashChannelId = pseudonymize(channelId);
  const result = await pool.query(
    `SELECT content FROM conversation_messages
      WHERE user_id = $1 AND channel_id = $2 AND role = 'assistant'
        AND created_at < (
          SELECT created_at FROM conversation_messages
          WHERE user_id = $1 AND channel_id = $2 AND role = 'user'
            AND content = $3
          ORDER BY created_at DESC LIMIT 1
        )
      ORDER BY created_at DESC LIMIT 1`,
    [hashUserId, hashChannelId, beforeMessageContent],
  );
  return result.rows[0]?.content ?? null;
}

export async function insertSolution(input: SolutionFeedback): Promise<void> {
  await pool.query(
    `INSERT INTO solution_feedback
       (question, answer, compact_content, user_id, channel_id, source_message_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.question,
      input.answer,
      input.compactContent,
      pseudonymize(input.userId),
      pseudonymize(input.channelId),
      input.sourceMessageId ? pseudonymize(input.sourceMessageId) : null,
    ],
  );
}
