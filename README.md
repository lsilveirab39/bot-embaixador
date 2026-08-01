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
- slash commands de preferências, perfil, exclusão de dados e registro de soluções;
- detecção de prompt injection em 3 camadas;
- pseudonimização de IDs armazenados (SHA-256);
- **quiz estilo Kahoot com `/game` e ranking por guild com `/ranking`**;
- **sistema de cargos automáticos por engajamento**.

> O nome "Embaixador" descreve a função educacional. O bot não deve se apresentar como canal oficial da UNIPDS/Anhanguera sem autorização formal.

**Autor:** Leandro S. Barbosa — Aluno da Pós-Graduação em Engenharia de Software com IA Aplicada (UNIPDS/Anhanguera)
**Contato:** leandro.silveirabarbosa@gmail.com

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
- Use Application Commands;
- Manage Roles (para cargos de recompensa).

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
- `/esquecer`: apaga preferências e histórico;
- `/resolver`: salva a última resposta como solução na base de conhecimento;
- `/game <tema>`: inicia um quiz estilo Kahoot (tema aleatório se omitido);
- `/ranking`: exibe o top 10 de jogadores da guild.

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

Os health checks retornam security headers (`X-Content-Type-Options`, `X-Frame-Options`, etc.) e aceitam apenas requisições `GET` (outros métodos retornam `405`).

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

## 9. Segurança

O bot implementa **defesa em profundidade** com múltiplas camadas:

### Detecção de Prompt Injection (3 camadas)

| Camada | Tipo | Custo | Configuração |
|--------|------|-------|--------------|
| Camada 1 | Prompt reforçado (in-prompt) | Zero | Sempre ativo |
| Camada 2 | Input guard (regex) | Zero | `ENABLE_INPUT_GUARD=true` (default) |
| Camada 3 | LLM guard (gpt-oss-safeguard-20b) | ~$0.00014/chamada | `ENABLE_LLM_GUARD=true` (default: `false`) |

### Controles de Infraestrutura

- allowlist opcional de servidores e canais;
- rate limit de 8 requisições/minuto por usuário;
- limite de 6000 caracteres na entrada e 1400 tokens na saída;
- segredos apenas por variáveis de ambiente (nunca hardcoded);
- política `data_collection` do OpenRouter configurável via `OPENROUTER_DENY_DATA_COLLECTION`;
- contexto recuperado tratado como conteúdo não confiável;
- separação do histórico por usuário e canal;
- exclusão de dados pelo próprio aluno (`/esquecer`);
- pseudonimização de IDs com SHA-256 truncado (16 hex);
- security headers no health server (`X-Content-Type-Options`, `X-Frame-Options`, etc.);
- HTTP method check no health server (aceita apenas `GET`);
- logs estruturados com redação automática de tokens e chaves.

Consulte `SECURITY.md`, `SECURITY-REPORT.md` e `docs/ARCHITECTURE.md`.

## 10. Quiz e Ranking

O comando `/game` inicia um quiz estilo Kahoot com:

- **10 perguntas** cobrindo módulos do curso;
- **4 alternativas** coloridas (🔴🟡🟢🔵);
- **Timer de 30s** por pergunta (pula se todos responderem);
- **Pontuação**: 1000 pts (1º), 800 pts (2º), 600 pts (3º), 400 pts (4º+);
- **Anti-repetição**: perguntas usadas ficam bloqueadas por 7 dias;
- **Placar ao vivo** entre perguntas (só com 2+ jogadores);
- **Pódio final** com 🥇🥈🥉 e desempenho por tema.

O comando `/ranking` exibe o top 10 de jogadores da guild com pontos, jogos jogados e taxa de acerto.

### Temas disponíveis

Machine Learning, Deep Learning, Sistemas de Recomendação, Algoritmos de Jogos, LLMs, Prompt Engineering, AI Agents, MCP, Modelos Locais, RAG, LangChain, Classificação de Intenções, Memória e Persistência, Segurança, GraphRAG, Multimodal e Monitoramento.

## 11. Cargos de Recompensa

O bot atribui cargos automaticamente com base em critérios de engajamento:

| Cargo | Critério |
|-------|----------|
| ⭐ Estrela do Ranking | #1 no ranking da guild |
| 🏆 Top 3 | Top 3 no ranking |
| 🧠 Gênio | 80%+ acerto em um jogo |
| 📚 Mentor | 10+ jogos e 5000+ pontos |
| 🎯 Dedicado | 10+ jogos jogados |

### Configuração

Crie os cargos no Discord e adicione os IDs no `.env`:

```env
ROLE_ESTRELA=id_do_cargo
ROLE_TOP3=id_do_cargo
ROLE_GENIO=id_do_cargo
ROLE_MENTOR=id_do_cargo
ROLE_DEDICADO=id_do_cargo
```

A verificação roda ao final de cada jogo e diariamente em horário aleatório.

---

**Repositório:** https://github.com/lsilveirab39/bot-embaixador
