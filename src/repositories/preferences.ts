import { pool } from "../db/pool.js";
import type { ExperienceLevel, ResponseStyle, UserPreferences } from "../types/domain.js";
import { pseudonymize } from "../utils/crypto.js";

interface PreferencePatch {
  language?: string;
  experienceLevel?: ExperienceLevel;
  responseStyle?: ResponseStyle;
  preferredLanguage?: string;
  learningGoal?: string;
}

const defaults = (userId: string): UserPreferences => ({
  userId,
  language: "pt-BR",
  experienceLevel: "intermediario",
  responseStyle: "didatico",
  preferredLanguage: "python",
  learningGoal: "",
});

export async function getPreferences(userId: string): Promise<UserPreferences> {
  const hash = pseudonymize(userId);
  const result = await pool.query(
    `SELECT user_id, language, experience_level, response_style, preferred_language, learning_goal
       FROM user_preferences
      WHERE user_id = $1`,
    [hash],
  );
  const row = result.rows[0];
  if (!row) return defaults(userId);
  return {
    userId: row.user_id,
    language: row.language,
    experienceLevel: row.experience_level,
    responseStyle: row.response_style,
    preferredLanguage: row.preferred_language,
    learningGoal: row.learning_goal,
  };
}

export async function savePreferences(
  userId: string,
  patch: PreferencePatch,
): Promise<UserPreferences> {
  const hash = pseudonymize(userId);
  const current = await getPreferences(userId);
  const next = { ...current, ...patch };
  await pool.query(
    `INSERT INTO user_preferences
       (user_id, language, experience_level, response_style, preferred_language, learning_goal)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       language = EXCLUDED.language,
       experience_level = EXCLUDED.experience_level,
       response_style = EXCLUDED.response_style,
       preferred_language = EXCLUDED.preferred_language,
       learning_goal = EXCLUDED.learning_goal,
       updated_at = NOW()`,
    [
      hash,
      next.language,
      next.experienceLevel,
      next.responseStyle,
      next.preferredLanguage,
      next.learningGoal,
    ],
  );
  return next;
}

export async function deletePreferences(userId: string): Promise<void> {
  await pool.query("DELETE FROM user_preferences WHERE user_id = $1", [pseudonymize(userId)]);
}
