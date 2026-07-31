# Segurança e privacidade

- Use uma chave OpenRouter dedicada, com limite de crédito e rotação periódica.
- Restrinja `ALLOWED_GUILD_IDS` e `ALLOWED_CHANNEL_IDS` em produção.
- O bot usa `allowedMentions.parse=[]` para evitar menções involuntárias.
- Nunca monte nomes de tabela ou coluna com entrada de usuário.
- O RAG trata documentos recuperados como dados não confiáveis para mitigar prompt injection indireta.
- A política de coleta de dados do OpenRouter é configurável via `OPENROUTER_DENY_DATA_COLLECTION`; a política efetiva deve ser validada para cada modelo/provedor.
- Não envie PII, avaliações ou material protegido para o RAG sem base legal e autorização.
- O comando `/esquecer` remove preferências e histórico do aluno.
- Logs estruturados são escritos em arquivo (`bot.log`) para evitar buffering de stdout; tokens são redigidos.
- Menção por cargo: o bot aceita menção a um cargo com o mesmo nome do bot (`@AskLeo`) além da menção direta ao usuário.
- Detecção de prompt injection em 3 camadas: prompt reforçado (Camada 1), input guard regex (Camada 2) e LLM guard opcional (Camada 3).

## Referências de controles

- OWASP Top 10 for LLM Applications: prompt injection, sensitive information disclosure e excessive agency.
- NIST AI RMF: governança, medição, gestão de riscos e rastreabilidade.
- CIS Controls v8: gestão de contas, configuração segura, logs e proteção de dados.
