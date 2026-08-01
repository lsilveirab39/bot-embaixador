import { pool } from "../db/pool.js";
import { logger } from "../config/logger.js";

export interface RankingEntry {
  userId: string;
  totalPoints: number;
  gamesPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  bestScore: number;
}

export interface HistoryEntry {
  theme: string;
  score: number;
  correct: number;
  total: number;
  playedAt: Date;
}

export async function saveGameResult(
  userId: string,
  guildId: string,
  theme: string,
  score: number,
  correct: number,
  total: number,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO game_ranking (user_id, guild_id, total_points, games_played, correct_answers, total_answers, best_score, updated_at)
       VALUES ($1, $2, $3, 1, $4, $5, $6, NOW())
       ON CONFLICT (user_id, guild_id) DO UPDATE SET
         total_points = game_ranking.total_points + $3,
         games_played = game_ranking.games_played + 1,
         correct_answers = game_ranking.correct_answers + $4,
         total_answers = game_ranking.total_answers + $5,
         best_score = GREATEST(game_ranking.best_score, $6),
         updated_at = NOW()`,
      [userId, guildId, score, correct, total, score],
    );

    await pool.query(
      `INSERT INTO game_history (user_id, guild_id, theme, score, correct, total, played_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, guildId, theme, score, correct, total],
    );
  } catch (error) {
    logger.error({ error, userId, guildId }, "Erro ao salvar resultado do jogo");
  }
}

export async function getGuildRanking(
  guildId: string,
  limit: number = 10,
): Promise<RankingEntry[]> {
  try {
    const result = await pool.query(
      `SELECT user_id, total_points, games_played, correct_answers, total_answers, best_score
       FROM game_ranking
       WHERE guild_id = $1
       ORDER BY total_points DESC
       LIMIT $2`,
      [guildId, limit],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      totalPoints: row.total_points,
      gamesPlayed: row.games_played,
      correctAnswers: row.correct_answers,
      totalAnswers: row.total_answers,
      bestScore: row.best_score,
    }));
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao buscar ranking da guild");
    return [];
  }
}

export async function getUserHistory(
  userId: string,
  guildId: string,
  limit: number = 5,
): Promise<HistoryEntry[]> {
  try {
    const result = await pool.query(
      `SELECT theme, score, correct, total, played_at
       FROM game_history
       WHERE user_id = $1 AND guild_id = $2
       ORDER BY played_at DESC
       LIMIT $3`,
      [userId, guildId, limit],
    );

    return result.rows.map((row) => ({
      theme: row.theme,
      score: row.score,
      correct: row.correct,
      total: row.total,
      playedAt: new Date(row.played_at),
    }));
  } catch (error) {
    logger.error({ error, userId, guildId }, "Erro ao buscar histórico do usuário");
    return [];
  }
}

export async function getAskedQuestionIds(guildId: string): Promise<Set<string>> {
  try {
    const result = await pool.query(
      `SELECT question_id FROM game_asked_questions
       WHERE guild_id = $1 AND asked_at > NOW() - INTERVAL '7 days'`,
      [guildId],
    );
    return new Set(result.rows.map((row) => row.question_id));
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao buscar perguntas usadas");
    return new Set();
  }
}

export async function saveAskedQuestions(guildId: string, questionIds: string[]): Promise<void> {
  if (questionIds.length === 0) return;
  try {
    const values: string[] = [];
    const params: unknown[] = [guildId];
    let paramIndex = 2;

    for (const id of questionIds) {
      values.push(`($1, $${paramIndex}, NOW())`);
      params.push(id);
      paramIndex++;
    }

    await pool.query(
      `INSERT INTO game_asked_questions (guild_id, question_id, asked_at)
       VALUES ${values.join(", ")}
       ON CONFLICT (guild_id, question_id) DO NOTHING`,
      params,
    );
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao salvar perguntas usadas");
  }
}

export async function cleanupExpiredQuestions(): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM game_asked_questions WHERE asked_at < NOW() - INTERVAL '7 days'`,
    );
  } catch (error) {
    logger.error({ error }, "Erro ao limpar perguntas expiradas");
  }
}
