import type { ChatInputCommandInteraction } from "discord.js";
import { logger } from "../config/logger.js";
import { compactSolution } from "../rag/compactor.js";
import { storeSolution } from "../rag/vector-repository.js";
import { deleteUserData } from "../repositories/conversations.js";
import { getPreferences, savePreferences } from "../repositories/preferences.js";
import { getLastAssistantTurn, getLastUserTurn, insertSolution } from "../repositories/solutions.js";
import type { ExperienceLevel, ResponseStyle } from "../types/domain.js";

export async function handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
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
