CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  experience_level TEXT NOT NULL DEFAULT 'intermediario',
  response_style TEXT NOT NULL DEFAULT 'didatico',
  preferred_language TEXT NOT NULL DEFAULT 'python',
  learning_goal TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT,
  channel_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_context
  ON conversation_messages (user_id, channel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY,
  namespace TEXT NOT NULL,
  source TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(namespace, source, source_hash, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_namespace
  ON knowledge_chunks(namespace);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_hnsw
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
