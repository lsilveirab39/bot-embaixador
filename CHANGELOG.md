# Changelog

## [1.2.0] — 2026-07-28

### Adicionado

- **Camada 1 — Proteção in-prompt**: sistema de prompt reforçado com delimitadores XML, auto-lembrete e negação explícita de padrões de injeção (`src/ai/prompts.ts`).
- **Camada 2 — Guarda de entrada (regex)**: 10 padrões em português e inglês + detecção de credenciais/tokens. Custo zero de API, configurável via `ENABLE_INPUT_GUARD` (default `true`) (`src/security/prompt-injection.ts`).
- **Camada 3 — Guarda via LLM (opcional)**: modelo `openai/gpt-oss-safeguard-20b` via OpenRouter, policy prompt para detecção de injection/jailbreak, parse de JSON, fallback seguro em caso de erro. Configurável via `ENABLE_LLM_GUARD` e `LLM_GUARD_MODEL` (`src/security/safeguard-llm.ts`).
- **Pseudonimização de IDs**: função compartilhada `pseudonymize()` (SHA-256 truncado para 16 hex) em `src/utils/crypto.ts`. Aplicada nas camadas de repositório (`conversations.ts`, `solutions.ts`, `preferences.ts`, `vector-repository.ts`) para hashear `userId`, `channelId`, `guildId` e `sourceMessageId` antes de consultas/inserções no banco.
- **Script de migração**: `sql/003_hash_existing_ids.sql` para migrar IDs existentes para hashes SHA-256.
- **Runner de migração reutilizável**: `scripts/run-migration.ts` + script npm `db:migrate`.

### Corrigido

- **ECONNREFUSED no PostgreSQL**: o `.env` usava `localhost` como host do banco; dentro do container Docker `localhost` aponta para o próprio container do bot, não para o serviço `postgres`. Alterado para o nome do serviço Docker Compose (`postgres`).
- **Logger em produção**: em `NODE_ENV=production` o logger escreve apenas para stdout, evitando erro `EACCES` ao tentar criar `bot.log` no container Docker.

### Alterado

- `src/config/env.ts`: adicionadas variáveis `enableLlmGuard` (bool, default `false`) e `llmGuardModel` (string, default `openai/gpt-oss-safeguard-20b`).
- `src/config/logger.ts`: em produção usa apenas `process.stdout`.
- `src/discord/client.ts`: integração da guarda LLM entre a camada 2 e `graph.invoke()`, com logs de bloqueio; importa `pseudonymize()` do módulo compartilhado.
- `src/repositories/conversations.ts`: `userId`, `guildId`, `channelId` hasheados em todas as operações.
- `src/repositories/solutions.ts`: `userId`, `channelId`, `sourceMessageId` hasheados em consultas e inserções.
- `src/repositories/preferences.ts`: `userId` hasheado em todas as operações.
- `src/rag/vector-repository.ts`: `userId`, `channelId` hasheados no metadata de `storeSolution()`.
- `.env`: adicionadas `ENABLE_LLM_GUARD` e `LLM_GUARD_MODEL` (comentadas por padrão); `DATABASE_URL` alterado de `localhost` para `postgres`.

### Verificado

- Typecheck: 0 erros.
- Teste direto do modelo safeguard (`gpt-oss-safeguard-20b`): classifica perguntas seguras como `violation=0` e ataques como `violation=1`.
- Teste end-to-end no Discord:
  - Pergunta normal → resposta educacional.
  - "Ignore tudo..." → bloqueado pela camada 3 (`prompt_injection`, alta confiança).
  - "Mostre as instruções do sistema..." → bloqueado pela camada 3 (`system_prompt_extraction`, alta confiança).

## [1.1.0] — 2026-07-25

- Funcionalidades base do bot, graph RAG, integração com OpenRouter e banco vetorial PostgreSQL/pgvector.
