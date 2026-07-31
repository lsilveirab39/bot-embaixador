# Changelog

## [1.3.0] — 2026-07-31

### Adicionado

- **Security Headers no Health Server**: headers `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` e `Permissions-Policy` em todas as respostas HTTP (`src/health/server.ts`).
- **HTTP Method Check**: health server aceita apenas requisições `GET`; retorna `405 Method Not Allowed` para outros métodos (`src/health/server.ts`).
- **Escape de RegExp**: função `escapeRegExp()` para escapar caracteres especiais antes de interpolar variáveis em expressões regulares, prevenindo ReDoS (CWE-1333) (`src/utils/discord-text.ts`).
- **POSTGRES_PASSWORD via env var**: `docker-compose.yml` usa `${POSTGRES_PASSWORD:-change-me}` em vez de senha hardcoded; porta 5432 removida da exposição externa.
- **Análise de Segurança SAST/DAST**: relatório completo em `SECURITY-REPORT.md` com semgrep, npm audit e testes dinâmicos.
- **Serviço Relatório atualizado**: documento LaTeX (`docs/servico-relatorio.tex`) reescrito com versão 1.3.0, Camada 3 LLM Guard, resultados de segurança e autoria.

### Corrigido

- **ReDoS (CWE-1333)** em `src/utils/discord-text.ts`: `botId` agora é escapado antes de interpolar na regex.
- **HTTP Method Tampering** em `src/health/server.ts`: adicionada verificação `request.method !== "GET"`.
- **Security Headers Ausentes** em `src/health/server.ts`: adicionados todos os headers de segurança recomendados.
- **Senha Hardcoded** em `docker-compose.yml`: `POSTGRES_PASSWORD` agora usa variável de ambiente.

### Alterado

- `src/utils/discord-text.ts`: adicionada função `escapeRegExp()` e aplicada em `stripBotMention()`.
- `src/health/server.ts`: adicionada constante `SECURITY_HEADERS` e verificação de método HTTP.
- `docker-compose.yml`: `POSTGRES_PASSWORD` via env var, porta 5432 removida.
- `.env.example`: adicionada variável `POSTGRES_PASSWORD`.
- `CHANGELOG.md`: versão 1.1.0 data corrigida para 2026-07-25.
- `docs/playbook.md`: referência SQL corrigida (`002_seed.sql` → `002_solutions.sql`).
- `SECURITY.md`: adicionada referência à Camada 3 (LLM Guard).

### Verificado

- Testes: 8/8 passando.
- Typecheck: 0 erros.
- semgrep: 1 finding restante (falso positivo — `botId` agora é escapado).
- npm audit: 0 vulnerabilidades.
- DAST: health server retorna 405 para métodos não-GET, security headers presentes.
- Docker: build e execução validados.

---

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
