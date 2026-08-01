import { SlashCommandBuilder } from "discord.js";

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lista todos os comandos disponíveis e como usá-los"),
  new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Mostra o tempo que o bot está ativo"),
  new SlashCommandBuilder()
    .setName("static")
    .setDescription("Exibe estatísticas de uso e performance do bot")
    .addStringOption((option) =>
      option
        .setName("escopo")
        .setDescription("Tipo de estatísticas a exibir")
        .addChoices(
          { name: "Minhas estatísticas", value: "usuario" },
          { name: "Estatísticas gerais do bot", value: "geral" },
        ),
    ),
  new SlashCommandBuilder()
    .setName("preferencias")
    .setDescription("Personaliza como o embaixador explica os conteúdos")
    .addStringOption((option) =>
      option
        .setName("idioma")
        .setDescription("Idioma das respostas")
        .addChoices(
          { name: "Português", value: "pt-BR" },
          { name: "English", value: "en-US" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("nivel")
        .setDescription("Seu nível atual")
        .addChoices(
          { name: "Iniciante", value: "iniciante" },
          { name: "Intermediário", value: "intermediario" },
          { name: "Avançado", value: "avancado" },
        ),
    )
    .addStringOption((option) =>
      option
        .setName("estilo")
        .setDescription("Como prefere receber as explicações")
        .addChoices(
          { name: "Direto", value: "direto" },
          { name: "Didático", value: "didatico" },
          { name: "Socrático", value: "socratico" },
        ),
    )
    .addStringOption((option) =>
      option.setName("linguagem").setDescription("Linguagem de programação preferida"),
    )
    .addStringOption((option) =>
      option.setName("objetivo").setDescription("Seu objetivo de aprendizagem atual"),
    ),
  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Mostra suas preferências atuais"),
  new SlashCommandBuilder()
    .setName("esquecer")
    .setDescription("Apaga suas preferências e histórico salvos pelo bot"),
  new SlashCommandBuilder()
    .setName("resolver")
    .setDescription("Marca a última resposta como solução e salva na base de conhecimento"),
  new SlashCommandBuilder()
    .setName("game")
    .setDescription("Inicia um quiz estilo Kahoot com temas do curso")
    .addStringOption((option) =>
      option
        .setName("tema")
        .setDescription("Tema do jogo (deixe vazio para aleatório)")
        .addChoices(
          { name: "Machine Learning", value: "machine-learning" },
          { name: "Deep Learning", value: "deep-learning" },
          { name: "Sistemas de Recomendação", value: "sistemas-de-recomendacao" },
          { name: "Algoritmos de Jogos", value: "algoritmos-de-jogos" },
          { name: "LLMs", value: "llms" },
          { name: "Prompt Engineering", value: "prompt-engineering" },
          { name: "AI Agents", value: "ai-agents" },
          { name: "MCP (Model Context Protocol)", value: "mcp" },
          { name: "Modelos Locais e OpenRouter", value: "modelos-locais" },
          { name: "RAG", value: "rag" },
          { name: "LangChain", value: "langchain" },
          { name: "Classificação de Intenções", value: "classificacao-de-intencoes" },
          { name: "Memória e Persistência", value: "memoria-e-persistencia" },
          { name: "Segurança", value: "seguranca" },
          { name: "GraphRAG com Neo4j", value: "graphrag" },
          { name: "Multimodal e Monitoramento", value: "multimodal-e-monitoramento" },
        ),
    ),
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Mostra o ranking de jogos do servidor"),
].map((command) => command.toJSON());

