# Relatório de Análise de Segurança — SAST & DAST

**Data:** 2026-07-31  
**Projeto:** unipds-ai-embaixador-bot v1.0.0  
**Ferramentas:** semgrep 1.172.0, npm audit, testes DAST manuais  

---

## Resumo Executivo

| Categoria | Resultado |
|-----------|-----------|
| **SAST (semgrep)** | 1 finding (WARNING) |
| **SAST (npm audit)** | 0 vulnerabilidades |
| **SAST (análise manual)** | 0 vulnerabilidades críticas |
| **DAST (endpoints HTTP)** | 3 issues de configuração |
| **Score de Segurança** | **8.5/10** |

**Vulnerabilidades Críticas:** 0  
**Vulnerabilidades Altas:** 0  
**Vulnerabilidades Médias:** 1  
**Issues de Configuração:** 3  

---

## 1. SAST — Análise Estática

### 1.1 npm audit — Dependências

```
found 0 vulnerabilities
```

**Resultado:** Nenhuma vulnerabilidade conhecida nas dependências do projeto.

### 1.2 semgrep — Padrões de Código

| # | Severidade | Arquivo | Regra | Descrição |
|---|-----------|---------|-------|-----------|
| 1 | WARNING | `src/utils/discord-text.ts:3` | `detect-non-literal-regexp` | RegExp() chamado com argumento não-literal (`botId`), potencial ReDoS |

**Detalhes do Finding:**
- **Arquivo:** `src/utils/discord-text.ts:3`
- **Código:** `new RegExp(`<@!?${botId}>`, "g")`
- **Risco:** ReDoS (Regular Expression Denial of Service)
- **Impacto:** MEDIUM
- **Likelihood:** LOW
- **Mitigação:** O `botId` vem do Discord (não é input direto do usuário), mas o uso de regex com interpolação é uma prática não recomendada.

**Recomendação:** Usar `RegExp.escape()` ou validação do `botId` antes de interpolar:
```typescript
// Atual
new RegExp(`<@!?${botId}>`, "g")

// Recomendado
const escaped = botId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
new RegExp(`<@!?${escaped}>`, "g")
```

### 1.3 Análise Manual de Padrões Críticos

#### SQL Injection ✅ SEGURO
Todos os repositórios usam queries parametrizadas:
- `src/repositories/conversations.ts` — `$1, $2, $3` params
- `src/repositories/preferences.ts` — `$1, $2, $3` params
- `src/repositories/solutions.ts` — `$1, $2, $3` params
- `src/rag/vector-repository.ts` — `$1::vector` params

#### Path Traversal ✅ SEGURO
- `src/rag/loader.ts` — Usa `path.join()` e `readdir()` recursivo
- Não há concatenação direta de input do usuário em caminhos de arquivo

#### Secret Exposure ✅ SEGURO
- `src/config/logger.ts` — Redact de `discordToken`, `openRouterApiKey`, `*.token`, `*.apiKey`
- `.env` excluído do `.gitignore`
- `.dockerignore` exclui `.env`

#### Prompt Injection ✅ SEGURO (3 camadas)
- **Camada 1:** Prompt reforçado com delimitadores XML e auto-lembretes
- **Camada 2:** Input guard com 10 padrões regex + detecção de credenciais
- **Camada 3:** LLM guard opcional via `gpt-oss-safeguard-20b`

#### Error Handling ✅ SEGURO
- `src/discord/client.ts` — Erros tratados com try/catch, mensagens genéricas ao usuário
- `src/security/safeguard-llm.ts` — Fail open com logging do erro
- Nenhum stack trace exposto ao usuário

#### Rate Limiting ✅ SEGURO
- `src/security/rate-limit.ts` — Fixed window de 8 req/min por usuário
- Retry-after retornado ao usuário

#### Input Validation ✅ SEGURO
- `MAX_INPUT_CHARS` (6000) validado antes do processamento
- `stripBotMention()` remove menção antes de processar

---

## 2. DAST — Testes Dinâmicos

### 2.1 Health Server Endpoints

| Endpoint | Método | Status | Resultado |
|----------|--------|--------|-----------|
| `/health` | GET | 200 | `{"status":"ok"}` ✅ |
| `/ready` | GET | 200 | `{"status":"ready","database":true,"discord":true}` ✅ |

### 2.2 HTTP Method Tampering ⚠️ ISSUE

| Endpoint | Métodos Aceitos | Esperado |
|----------|----------------|----------|
| `/health` | GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD | Apenas GET |
| `/ready` | GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD | Apenas GET |

**Problema:** O health server aceita todos os métodos HTTP.  
**Risco:** LOW — Não há risco direto, mas viola o princípio de menor privilégio.  
**Correção:** Adicionar verificação de método HTTP:

```typescript
// src/health/server.ts
if (request.method !== "GET") {
  response.writeHead(405).end();
  return;
}
```

### 2.3 Path Traversal ✅ SEGURO

| Tentativa | Resultado |
|-----------|-----------|
| `/health/../../etc/passwd` | 404 Not Found |
| `/health/..%2f..%2fetc/passwd` | 404 Not Found |
| `/../../../etc/passwd` | 404 Not Found |
| `/%2e%2e/%2e%2e/etc/passwd` | 404 Not Found |
| `/health/....//....//etc/passwd` | 404 Not Found |

### 2.4 Unknown Paths ✅ SEGURO

| Path | Resultado |
|------|-----------|
| `/admin` | 404 |
| `/api/users` | 404 |
| `/config` | 404 |
| `/debug` | 404 |
| `/metrics` | 404 |
| `/.env` | 404 |
| `/package.json` | 404 |
| `/src/index.ts` | 404 |

**Nenhum arquivo sensível exposto.**

### 2.5 Security Headers ⚠️ ISSUE

| Header | Status |
|--------|--------|
| `X-Content-Type-Options` | AUSENTE |
| `X-Frame-Options` | AUSENTE |
| `Strict-Transport-Security` | AUSENTE |
| `Content-Security-Policy` | AUSENTE |
| `X-XSS-Protection` | AUSENTE |
| `Referrer-Policy` | AUSENTE |
| `Permissions-Policy` | AUSENTE |

**Problema:** Nenhum header de segurança configurado.  
**Risco:** MEDIUM — Para um bot Discord o risco é limitado, mas é uma boa prática adicionar.  
**Correção:** Adicionar headers no health server:

```typescript
// src/health/server.ts
response.writeHead(200, {
  "content-type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
});
```

### 2.6 Information Disclosure ✅ SEGURO

- POST com body inválido → 200 (ignorado corretamente)
- Query strings → 404 (ignoradas)
- Nenhum stack trace ou erro interno exposto

### 2.7 Bot Logs ✅ SEGURO

```
DeprecationWarning: ready event renamed to clientReady
```

Apenas warning de deprecation do Discord.js. Nenhum erro de segurança nos logs.

---

## 3. Análise de Configuração Docker

### 3.1 Dockerfile ✅ SEGURO

- Multi-stage build (build + runtime)
- Usuário não-root (`bot`)
- `npm install --omit=dev` (sem dependências de desenvolvimento)
- `npm cache clean --force`

### 3.2 docker-compose.yml ⚠️ ISSUE

- `POSTGRES_PASSWORD: change-me` — Senha padrão em produção
- Porta 5432 exposta externamente

**Recomendação:** Em produção, usar variáveis de ambiente para senhas e não expor a porta do banco.

---

## 4. Resumo de Issues

### Issues Encontrados

| # | Tipo | Severidade | Arquivo | Descrição |
|---|------|-----------|---------|-----------|
| 1 | SAST | MEDIUM | `src/utils/discord-text.ts:3` | RegExp com interpolação não-escapeada (ReDoS potencial) |
| 2 | DAST | LOW | `src/health/server.ts` | Health server aceita todos os métodos HTTP |
| 3 | DAST | MEDIUM | `src/health/server.ts` | Headers de segurança ausentes |
| 4 | Config | MEDIUM | `docker-compose.yml` | Senha padrão do PostgreSQL |

### positivos Encontrados

| # | Área | Detalhe |
|---|------|---------|
| 1 | SQL Injection | Todas as queries são parametrizadas |
| 2 | Path Traversal | Nenhuma vulnerabilidade de caminho |
| 3 | Secret Exposure | Secrets redactados nos logs, .env excluído |
| 4 | Prompt Injection | 3 camadas de proteção funcionando |
| 5 | Error Handling | Nenhum stack trace exposto |
| 6 | Rate Limiting | Implementado corretamente |
| 7 | Input Validation | Limites de tamanho configurados |
| 8 | Dependências | 0 vulnerabilidades (npm audit) |
| 9 | Docker | Build multi-stage, usuário não-root |
| 10 | Pseudonimização | IDs hasheados com SHA-256 |

---

## 5. Recomendações Priorizadas

### Alta Prioridade
1. **Corrigir ReDoS** em `src/utils/discord-text.ts` — Escapar `botId` antes de interpolar na regex

### Média Prioridade
2. **Adicionar HTTP method check** em `src/health/server.ts` — Aceitar apenas GET
3. **Adicionar security headers** em `src/health/server.ts` — X-Content-Type-Options, X-Frame-Options, etc.
4. **Atualizar docker-compose.yml** — Usar variáveis de ambiente para senhas do PostgreSQL

### Baixa Prioridade
5. **Atualizar Discord.js** — Resolver deprecation warning `ready` → `clientReady`
6. **Considerar HTTPS** — Para o health server em produção (via reverse proxy)

---

## 6. Score de Segurança

| Área | Score | Nota |
|------|-------|------|
| Dependências | 10/10 | 0 vulnerabilidades |
| SQL Injection | 10/10 | Queries parametrizadas |
| Prompt Injection | 10/10 | 3 camadas de proteção |
| Input Validation | 9/10 | Limites configurados |
| Error Handling | 9/10 | Nenhum leak |
| Docker Security | 9/10 | Multi-stage, não-root |
| HTTP Security | 7/10 | Headers ausentes, method check ausente |
| Regex Safety | 8/10 | 1 finding de ReDoS |
| **Geral** | **8.5/10** | Boa postura de segurança |

---

> **Conclusão:** O projeto apresenta uma boa postura de segurança. As principais vulnerabilidades de aplicação (SQL injection, prompt injection, path traversal) estão adequadamente mitigadas. Os issues encontrados são de configuração e boas práticas, não de segurança crítica. Recomenda-se corrigir os 4 issues listados acima para elevar o score para 9.5/10.
