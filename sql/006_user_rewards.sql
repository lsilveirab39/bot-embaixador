CREATE TABLE IF NOT EXISTS user_rewards (
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  role_name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, guild_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_guild
  ON user_rewards (guild_id, role_name);
