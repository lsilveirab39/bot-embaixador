-- Migration: hashear IDs existentes nas tabelas para pseudonimização
-- Requer pgcrypto (CREATE EXTENSION IF NOT EXISTS pgcrypto)
-- Aplicar APÓS o deploy do código que passa a hashear os IDs.
-- Assim o código novo trabalha com IDs hashados e esta migração
-- converte os registros antigos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION pseudonymize(val TEXT) RETURNS TEXT AS $$
  SELECT LEFT(encode(digest(val, 'sha256'), 'hex'), 16);
$$ LANGUAGE sql IMMUTABLE;

-- 1. conversation_messages
UPDATE conversation_messages
   SET user_id    = pseudonymize(user_id),
       guild_id   = CASE WHEN guild_id IS NOT NULL THEN pseudonymize(guild_id) ELSE NULL END,
       channel_id = pseudonymize(channel_id);

-- 2. user_preferences (PK muda → insere novo, apaga antigo)
INSERT INTO user_preferences
  (user_id, language, experience_level, response_style, preferred_language, learning_goal, created_at, updated_at)
SELECT pseudonymize(user_id),
       language,
       experience_level,
       response_style,
       preferred_language,
       learning_goal,
       created_at,
       updated_at
  FROM user_preferences
ON CONFLICT (user_id) DO UPDATE SET
       language            = EXCLUDED.language,
       experience_level    = EXCLUDED.experience_level,
       response_style      = EXCLUDED.response_style,
       preferred_language  = EXCLUDED.preferred_language,
       learning_goal       = EXCLUDED.learning_goal,
       updated_at          = EXCLUDED.updated_at;

DELETE FROM user_preferences WHERE user_id ~ '^\d+$';

-- 3. solution_feedback
UPDATE solution_feedback
   SET user_id           = pseudonymize(user_id),
       channel_id        = pseudonymize(channel_id),
       source_message_id = CASE WHEN source_message_id IS NOT NULL THEN pseudonymize(source_message_id) ELSE NULL END;

-- 4. knowledge_chunks (apenas solutions namespace)
UPDATE knowledge_chunks
   SET metadata = jsonb_set(
         jsonb_set(metadata, '{solvedBy}',   to_jsonb(pseudonymize(metadata->>'solvedBy'))),
         '{channelId}', to_jsonb(pseudonymize(metadata->>'channelId'))
       )
 WHERE metadata ? 'solvedBy';

DROP FUNCTION pseudonymize(TEXT);
