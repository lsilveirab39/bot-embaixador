# AGENTS.md

Instruções para agentes de código neste repositório (bot Discord educacional: discord.js 14 + LangChain/LangGraph + OpenRouter + PostgreSQL/pgvector).

## Comandos

- `npm run check` = typecheck + testes; é o portão de verificação padrão e roda sem `.env`, Docker ou rede.
- Testes usam o runner nativo `node:test` via tsx (`tsx --test tests/**/*.test.ts`) — **não** Jest/Vitest. Arquivo único: `npx tsx --test tests/triggers.test.ts`.
- Não há linter/formatter configurado; o typecheck é a única barreira estática.
- Desenvolvimento: `npm run dev` (tsx watch). Build: `npm run build`.

## Armadilhas do código

- ESM puro (`"type": "module"` + NodeNext): imports relativos em `.ts` exigem extensão `.js`.
- TypeScript strict com `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`: indexar arrays retorna `T | undefined`.
- `src/config/env.ts` lança erro **no import** se faltar `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `OPENROUTER_API_KEY` ou `DATABASE_URL`. Os módulos cobertos por testes (`triggers.ts`, `chunking.ts`, `discord-text.ts`) são puros de propósito — não os acople a `env.ts` nem adicione testes que importem o grafo completo.
- `EMBEDDING_DIMENSIONS` deve permanecer 1536: o app recusa iniciar com outro valor porque `sql/001_init.sql` fixa `VECTOR(1536)`. Mudar exige alterar o schema SQL junto.

## Banco de dados

- `npm run db:init` aplica **apenas** `sql/001_init.sql`. As migrações `002_solutions.sql`, `004_game_tables.sql`, `005_game_asked_questions.sql` e `006_user_rewards.sql` não são aplicadas automaticamente (nem pelo mount de initdb do docker-compose). Aplique-as manualmente: `npx tsx scripts/run-migration.ts sql/<arquivo>.sql`. Sem elas, `/game`, `/ranking` e `/resolver` falham.
- `npm run db:migrate` está hardcoded para `003_hash_existing_ids.sql`; para outros arquivos use o runner diretamente.
- IDs do Discord nunca são gravados crus: toda persistência passa pela pseudonimização SHA-256 truncada a 16 hex (`src/utils/crypto.ts`) na camada de repositórios.

## Fluxos operacionais

- Novo slash command: definir em `src/discord/commands.ts` + handler em `src/discord/interactions.ts` + registrar com `npm run discord:register` (exige token/client/guild no `.env`; com `DISCORD_GUILD_ID` a propagação é instantânea, sem ela demora ~1h).
- Ingestão RAG: `npm run ingest -- --namespace <ns> --path ./dir`; cada ingestão substitui os chunks anteriores da mesma fonte+namespace.
- Respostas acima de 1900 chars são divididas antes do envio (`src/utils/discord-text.ts`).

## Convenções

- Todo texto — código, comentários, logs, erros, docs e commits — é em português. Commits seguem Conventional Commits (`feat:`, `fix:`, `docs:`).
- Segurança é requisito do domínio: entrada do usuário é conteúdo não confiável, segredos só via env, logger pino com redação automática (`src/config/logger.ts`). Consulte `SECURITY.md`, `SECURITY-REPORT.md` e `docs/ARCHITECTURE.md` antes de alterar o fluxo de mensagens.
- `scripts/_test-*.{sh,mjs}` são sondas manuais ad-hoc contra a API do OpenRouter; não fazem parte do `npm test`.
