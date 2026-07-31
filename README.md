# Embaixador de Engenharia de IA Aplicada — Discord

Projeto Node.js/TypeScript para um bot educacional no Discord com:

- LangChain por meio de `ChatOpenRouter`;
- LangGraph para orquestrar contexto, recuperação e resposta;
- LangSmith para tracing e avaliação;
- RAG persistente em PostgreSQL + pgvector;
- embeddings e chat pela API do OpenRouter;
- preferências explícitas por aluno;
- histórico curto isolado por usuário e canal;
- resposta somente quando o aluno menciona o bot ou responde a uma mensagem dele;
- slash commands de preferências, perfil e exclusão de dados.

> O nome “Embaixador” descreve a função educacional. O bot não deve se apresentar como canal oficial da UNIPDS/Anhanguera sem autorização formal.

## 1. Pré-requisitos

- Node.js 20.19 ou superior;
- Docker com Compose;
- aplicação e bot criados no Discord Developer Portal;
- chave da API OpenRouter;
- conta e chave LangSmith, caso queira tracing.

## 2. Configuração

```bash
cp .env.example .env
```

Preencha pelo menos:

```env
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
OPENROUTER_API_KEY=...
DATABASE_URL=postgresql://embaixador:change-me@localhost:5432/embaixador
LANGSMITH_API_KEY=...
```

No Discord Developer Portal, habilite **Message Content Intent** para aceitar respostas ao bot sem nova menção. Para operar apenas por menção, desative `ENABLE_REPLY_TRIGGER` e avalie remover esse intent do código.

Permissões mínimas recomendadas para o bot:

- View Channels;
- Send Messages;
- Read Message History;
- Use Application Commands.

Não conceda Administrator.

## 3. Banco de dados

```bash
docker compose up -d postgres
npm install
npm run db:init
```

## 4. Registrar slash commands

Durante desenvolvimento, defina `DISCORD_GUILD_ID` para propagação imediata:

```bash
npm run discord:register
```

Comandos:

- `/preferencias`: nível, estilo, linguagem preferida e objetivo;
- `/perfil`: exibe as preferências;
- `/esquecer`: apaga preferências e histórico.

## 5. Ingestão do RAG

O loader suporta `.md`, `.txt`, `.json`, `.csv`, `.html` e `.htm`. Converta PDFs autorizados para texto ou Markdown antes da ingestão.

```bash
npm run ingest -- --namespace course --path ./knowledge/course
npm run ingest -- --namespace ai --path ./knowledge/ai
npm run ingest -- --namespace programming --path ./knowledge/programming
```

Cada nova ingestão substitui os chunks anteriores da mesma fonte e namespace.

## 6. Executar

Desenvolvimento:

```bash
npm run dev
```

Docker completo:

```bash
docker compose up --build
```

Health checks:

- `GET /health`: processo ativo;
- `GET /ready`: Discord e PostgreSQL prontos.

## 7. Uso no Discord

O bot ignora conversas comuns. Ele responde quando:

- Um **usuário** menciona o bot diretamente (`@AskLeo`);
- Um **cargo** com o mesmo nome do bot é mencionado (`@AskLeo` cargo);
- Um usuário **responde** a uma mensagem anterior do bot (quando `ENABLE_REPLY_TRIGGER=true`).

Exemplos que disparam resposta:

```text
@AskLeo Qual a diferença entre LangChain e LangGraph?
```

```text
Qual a diferença entre LangChain e LangGraph?
```
(resposta direta a uma mensagem anterior do bot)

## 8. LangSmith

Configure:

```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=unipds-ai-embaixador
```

As execuções do LangGraph e as chamadas LangChain ficam associadas ao projeto. Para produção, crie datasets de avaliação com perguntas reais anonimizadas e critérios como fidelidade às fontes, correção técnica, utilidade e segurança.

## 9. Decisões de segurança

- allowlist opcional de servidores e canais;
- limite por usuário e por minuto;
- limite de caracteres e tokens;
- segredos apenas por variáveis de ambiente;
- política `data_collection` do OpenRouter configurável via `OPENROUTER_DENY_DATA_COLLECTION` (verifique a política de privacidade de cada modelo/provedor);
- contexto recuperado tratado como conteúdo não confiável;
- separação do histórico por usuário e canal;
- exclusão de dados pelo próprio aluno;
- nenhuma ação administrativa delegada ao LLM;
- logs escritos em arquivo (`bot.log`) para evitar buffering de stdout;
- detecção de menção por cargo: o bot responde quando um cargo com o mesmo nome do bot é mencionado.

Consulte `SECURITY.md` e `docs/ARCHITECTURE.md`.
