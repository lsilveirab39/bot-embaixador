CREATE TABLE IF NOT EXISTS game_asked_questions (
  guild_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  asked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guild_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_asked_guild_time
  ON game_asked_questions (guild_id, asked_at DESC);
