import type { ChatInputCommandInteraction } from "discord.js";
import { logger } from "../config/logger.js";
import { compactSolution } from "../rag/compactor.js";
import { storeSolution } from "../rag/vector-repository.js";
import { deleteUserData } from "../repositories/conversations.js";
import { getPreferences, savePreferences } from "../repositories/preferences.js";
import { getLastAssistantTurn, getLastUserTurn, insertSolution } from "../repositories/solutions.js";
import type { ExperienceLevel, ResponseStyle } from "../types/domain.js";
import { getBotStats, getUptime, getUserStats, getBootTime } from "../utils/stats.js";

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.commandName === "help") {
    const commands = [
      { name: "/help", desc: "Lista todos os comandos disponíveis e como usá-los" },
      { name: "/uptime", desc: "Mostra o tempo que o bot está ativo" },
      { name: "/static", desc: "Exibe estatísticas de uso e performance do bot" },
      { name: "/preferencias", desc: "Personaliza como o embaixador explica os conteúdos" },
      { name: "/perfil", desc: "Mostra suas preferências atuais" },
      { name: "/esquecer", desc: "Apaga suas preferências e histórico salvos pelo bot" },
      { name: "/resolver", desc: "Marca a última resposta como solução e salva na base de conhecimento" },
    ];

    const lines = [
      "**📚 Comandos do Embaixador**\n",
      ...commands.map((c) => `• **${c.name}** — ${c.desc}`),
      "",
      "**Dica:** Use `@Embaixador` seguido de sua dúvida para obter uma resposta educacional.",
      "**Dica:** Use `/preferencias` para personalizar nível, estilo e linguagem das respostas.",
    ];

    await interaction.reply({ ephemeral: true, content: lines.join("\n") });
    return;
  }

  if (interaction.commandName === "uptime") {
    const uptime = getUptime();
    const bootTime = getBootTime();
    const bootDate = new Date(bootTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    await interaction.reply({
      ephemeral: true,
      content: [
        "**⏱️ Tempo de Atividade**\n",
        `**Uptime:** ${uptime}`,
        `**Inicializado em:** ${bootDate}`,
        `**Versão:** 1.3.0`,
      ].join("\n"),
    });
    return;
  }

  if (interaction.commandName === "static") {
    const escopo = interaction.options.getString("escopo") || "usuario";

    if (escopo === "usuario") {
      const user = getUserStats(interaction.user.id);
      await interaction.reply({
        ephemeral: true,
        content: [
          "**📊 Suas Estatísticas**\n",
          `**Perguntas hoje:** ${user.questionsToday}`,
          `**Perguntas esta semana:** ${user.questionsThisWeek}`,
          `**Perguntas este mês:** ${user.questionsThisMonth}`,
          `**Total de perguntas:** ${user.totalQuestions}`,
        ].join("\n"),
      });
      return;
    }

    const bot = getBotStats();
    const ping = interaction.client.ws.ping;

    await interaction.reply({
      ephemeral: true,
      content: [
        "**📊 Estatísticas Gerais do Bot**\n",
        "**Atividade:**",
        `• Mensagens recebidas: **${bot.messagesReceived}**`,
        `• Mensagens respondidas: **${bot.messagesResponded}**`,
        `• Total de perguntas (todos os usuários): **${bot.totalQuestionsAllUsers}**`,
        "",
        "**Performance:**",
        `• Tempo médio de resposta: **${formatMs(bot.averageResponseTime)}**`,
        `• Tempo mínimo de resposta: **${formatMs(bot.minResponseTime)}**`,
        `• Tempo máximo de resposta: **${formatMs(bot.maxResponseTime)}**`,
        `• Latência WebSocket (ping): **${ping}ms**`,
        "",
        "**Sistema:**",
        `• Uptime: **${bot.uptime}**`,
        `• Inicializado em: **${bot.bootTime.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}**`,
      ].join("\n"),
    });
    return;
  }

  if (interaction.commandName === "preferencias") {
    const language = interaction.options.getString("idioma");
    const level = interaction.options.getString("nivel") as ExperienceLevel | null;
    const style = interaction.options.getString("estilo") as ResponseStyle | null;
    const preferredLanguage = interaction.options.getString("linguagem");
    const learningGoal = interaction.options.getString("objetivo");
    const preferences = await savePreferences(interaction.user.id, {
      ...(language ? { language } : {}),
      ...(level ? { experienceLevel: level } : {}),
      ...(style ? { responseStyle: style } : {}),
      ...(preferredLanguage ? { preferredLanguage: preferredLanguage.slice(0, 40) } : {}),
      ...(learningGoal ? { learningGoal: learningGoal.slice(0, 500) } : {}),
    });
    await interaction.reply({
      ephemeral: true,
      content: `Preferências salvas: idioma **${preferences.language}**, nível **${preferences.experienceLevel}**, estilo **${preferences.responseStyle}**, linguagem **${preferences.preferredLanguage}**.`,
    });
    return;
  }

  if (interaction.commandName === "perfil") {
    const preferences = await getPreferences(interaction.user.id);
    await interaction.reply({
      ephemeral: true,
      content: [
        `**Idioma:** ${preferences.language}`,
        `**Nível:** ${preferences.experienceLevel}`,
        `**Estilo:** ${preferences.responseStyle}`,
        `**Linguagem:** ${preferences.preferredLanguage}`,
        `**Objetivo:** ${preferences.learningGoal || "não informado"}`,
      ].join("\n"),
    });
    return;
  }

  if (interaction.commandName === "esquecer") {
    await deleteUserData(interaction.user.id);
    await interaction.reply({
      ephemeral: true,
      content: "Suas preferências e seu histórico de conversa foram apagados.",
    });
    return;
  }

  if (interaction.commandName === "resolver") {
    await interaction.deferReply({ ephemeral: true });

    const [question, answer] = await Promise.all([
      getLastUserTurn(interaction.user.id, interaction.channelId),
      getLastAssistantTurn(interaction.user.id, interaction.channelId),
    ]);

    if (!question || !answer) {
      await interaction.editReply("Nenhuma conversa recente encontrada para salvar como solução.");
      return;
    }

    try {
      const compact = await compactSolution(question, answer);
      await storeSolution({
        question,
        compactContent: compact,
        userId: interaction.user.id,
        channelId: interaction.channelId,
      });
      await insertSolution({
        question,
        answer,
        compactContent: compact,
        userId: interaction.user.id,
        channelId: interaction.channelId,
        sourceMessageId: null,
      });
      await interaction.editReply("✅ Solução salva na base de conhecimento!");
    } catch (error) {
      logger.error({ error }, "Erro ao salvar solução via comando /resolver");
      await interaction.editReply("Erro ao salvar solução. Tente novamente.");
    }
  }
}
