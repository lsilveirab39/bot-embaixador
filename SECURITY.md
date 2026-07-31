# Segurança e Privacidade

**Autor:** Leandro S. Barbosa — leandro.silveirabarbosa@gmail.com

## Controles de Segurança

### Detecção de Prompt Injection (3 camadas)

- **Camada 1 — Prompt Reforçado:** delimitadores XML, auto-lembretes e negação explícita de padrões de injeção no system prompt (`src/ai/prompts.ts`).
- **Camada 2 — Input Guard:** scanner local com 10 padrões regex em português e inglês + detecção de credenciais/tokens. Custo zero de API (`src/security/prompt-injection.ts`).
- **Camada 3 — LLM Guard (opcional):** modelo `openai/gpt-oss-safeguard-20b` via OpenRouter para classificação de injection/jailbreak. Custo ~$0.00014/chamada (`src/security/safeguard-llm.ts`).

### Infraestrutura e Rede

- Use uma chave OpenRouter dedicada, com limite de crédito e rotação periódica.
- Restrinja `ALLOWED_GUILD_IDS` e `ALLOWED_CHANNEL_IDS` em produção.
- O bot usa `allowedMentions.parse=[]` para evitar menções involuntárias.
- Nunca monte nomes de tabela ou coluna com entrada de usuário.
- O RAG trata documentos recuperados como dados não confiáveis para mitigar prompt injection indireta.
- A política de coleta de dados do OpenRouter é configurável via `OPENROUTER_DENY_DATA_COLLECTION`; a política efetiva deve ser validada para cada modelo/provedor.
- Não envie PII, avaliações ou material protegido para o RAG sem base legal e autorização.

### Privacidade dos Dados

- O comando `/esquecer` remove preferências e histórico do aluno.
- Pseudonimização de IDs: `userId`, `channelId`, `guildId` e `sourceMessageId` são hasheados com SHA-256 truncado (16 hex) antes de qualquer armazenamento.
- Logs estruturados são escritos em arquivo (`bot.log`) para evitar buffering de stdout; tokens são redigidos.
- Menção por cargo: o bot aceita menção a um cargo com o mesmo nome do bot (`@AskLeo`) além da menção direta ao usuário.

### Health Server

- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- HTTP method check: aceita apenas `GET`; retorna `405` para outros métodos.
- Nenhuma informação sensível exposta em respostas de erro.

### Análise de Segurança

- SAST: semgrep + npm audit (0 vulnerabilidades em dependências).
- DAST: testes dinâmicos nos endpoints HTTP (path traversal, method tampering, headers).
- Relatório completo em `SECURITY-REPORT.md`.

## Referências de Controles

- OWASP Top 10 for LLM Applications: prompt injection, sensitive information disclosure e excessive agency.
- NIST AI RMF: governança, medição, gestão de riscos e rastreabilidade.
- CIS Controls v8: gestão de contas, configuração segura, logs e proteção de dados.
