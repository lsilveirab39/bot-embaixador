import { pool } from "../db/pool.js";
import type { ConversationTurn } from "../types/domain.js";
import { pseudonymize } from "../utils/crypto.js";

export async function getRecentConversation(
  userId: string,
  channelId: string,
  limit: number,
): Promise<ConversationTurn[]> {
  if (limit <= 0) return [];
  const result = await pool.query(
    `SELECT role, content
       FROM conversation_messages
      WHERE user_id = $1 AND channel_id = $2
      ORDER BY created_at DESC
      LIMIT $3`,
    [pseudonymize(userId), pseudonymize(channelId), limit],
  );
  return result.rows.reverse().map((row) => ({
    role: row.role,
    content: row.content,
  }));
}

export async function saveConversationTurn(input: {
  userId: string;
  guildId: string | null;
  channelId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO conversation_messages (user_id, guild_id, channel_id, role, content)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      pseudonymize(input.userId),
      input.guildId ? pseudonymize(input.guildId) : null,
      pseudonymize(input.channelId),
      input.role,
      input.content,
    ],
  );
}

export async function deleteUserData(userId: string): Promise<void> {
  const hash = pseudonymize(userId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM conversation_messages WHERE user_id = $1", [hash]);
    await client.query("DELETE FROM user_preferences WHERE user_id = $1", [hash]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
