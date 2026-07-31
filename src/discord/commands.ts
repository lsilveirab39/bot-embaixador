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
].map((command) => command.toJSON());

