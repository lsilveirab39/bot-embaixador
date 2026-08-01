import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  GatewayIntentBits,
  Partials,
  type Message,
} from "discord.js";
import { embaixadorGraph } from "../ai/graph.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { compactSolution } from "../rag/compactor.js";
import { storeSolution } from "../rag/vector-repository.js";
import { getLastAssistantTurn, getLastUserTurn, insertSolution } from "../repositories/solutions.js";
import { saveConversationTurn } from "../repositories/conversations.js";
import { FixedWindowRateLimiter } from "../security/rate-limit.js";
import { hasCredentials, scanInput } from "../security/prompt-injection.js";
import { checkWithGuardLLM } from "../security/safeguard-llm.js";
import type { AnswerSource } from "../types/domain.js";
import { pseudonymize } from "../utils/crypto.js";
import { splitDiscordMessage, stripBotMention } from "../utils/discord-text.js";
import { incrementMessagesReceived, incrementMessagesResponded, recordQuestion, recordResponse } from "../utils/stats.js";
import { handleInteraction } from "./interactions.js";
import { shouldRespond } from "./triggers.js";
import { getActiveGame, handleAnswer } from "../game/engine.js";

const limiter = new FixedWindowRateLimiter(env.userRateLimitPerMinute, 60_000);

async function isReplyToBot(message: Message, botId: string): Promise<boolean> {
  if (!message.reference?.messageId) return false;
  try {
    const referenced = await message.fetchReference();
    return referenced.author.id === botId;
  } catch {
    return false;
  }
}

function isAllowed(set: ReadonlySet<string>, id: string | null): boolean {
  return set.size === 0 || (id !== null && set.has(id));
}

const SOLUTION_KEYWORDS = [
  "funcionou", "obrigado", "obrigada", "deu certo", "resolveu",
  "valeu", "valeu mesmo", "ajudou", "era isso", "consegui",
  "deu certo sim", "thank", "thanks", "worked", "solved",
];

function isSolutionConfirmation(content: string): boolean {
  const lower = content.toLowerCase();
  return SOLUTION_KEYWORDS.some((kw) => lower.includes(kw));
}

async function tryAutoSaveSolution(message: Message, botUser: { id: string }): Promise<void> {
  if (message.author.bot) return;
  if (!isSolutionConfirmation(message.content)) return;
  if (message.mentions.users.has(botUser.id)) return;

  const lastUserQ = await getLastUserTurn(message.author.id, message.channelId);
  if (!lastUserQ) return;

  const lastAssistant = await getLastAssistantTurn(message.author.id, message.channelId);
  if (!lastAssistant) return;

  let compact: string;
  try {
    compact = await compactSolution(lastUserQ, lastAssistant);
  } catch {
    return;
  }

  try {
    await storeSolution({
      question: lastUserQ,
      compactContent: compact,
      userId: message.author.id,
      channelId: message.channelId,
    });
    await insertSolution({
      question: lastUserQ,
      answer: lastAssistant,
      compactContent: compact,
      userId: message.author.id,
      channelId: message.channelId,
      sourceMessageId: message.id,
    });
    logger.info({ userId: message.author.id }, "Solução salva automaticamente");
  } catch (error) {
    logger.warn({ error }, "Falha ao salvar solução automaticamente");
  }
}

export function createDiscordClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
    allowedMentions: { parse: [], repliedUser: false },
  });

  client.once("ready", (readyClient) => {
    logger.info(
      { botUser: readyClient.user.tag, guildCount: readyClient.guilds.cache.size },
      "Bot conectado ao Discord",
    );
  });

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name !== "🎮") return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const message = reaction.message;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }

    if (!message.guild) return;

    const session = getActiveGame(message.channelId);
    if (!session || session.running) return;

    const member = message.guild.members.cache.get(user.id);
    const displayName = member?.displayName ?? user.globalName ?? user.username ?? "Jogador";
    session.players.set(user.id, { userId: user.id, displayName, score: 0 });

    if (message.channel.isTextBased() && !message.channel.isDMBased()) {
      await message.channel.send(`${displayName} entrou no jogo! (${session.players.size} jogador(es))`).catch(() => {});
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      try {
        await handleInteraction(interaction);
      } catch (error) {
        logger.error({ error, command: interaction.commandName }, "Erro ao processar slash command");
        const payload = { ephemeral: true, content: "Ocorreu um erro ao processar o comando." } as const;
        if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
        else await interaction.reply(payload);
      }
      return;
    }

    if (interaction.isButton()) {
      const game = getActiveGame(interaction.channelId);
      if (!game || !game.running) return;

      const optionIndex = ["game_opt_0", "game_opt_1", "game_opt_2", "game_opt_3"].indexOf(interaction.customId);
      if (optionIndex === -1) return;

      const member = interaction.guild?.members.cache.get(interaction.user.id);
      const displayName = member?.displayName ?? interaction.user.globalName ?? interaction.user.username ?? "Jogador";

      const result = await handleAnswer(game, interaction.user.id, displayName, optionIndex);

      const messages: Record<string, string> = {
        correct: "✅ Você acertou! +1000 pts",
        wrong: "❌ Você errou!",
        already_answered: "⏳ Você já respondeu esta pergunta!",
        game_not_running: "⚠️ O jogo já acabou.",
      };

      await interaction.reply({ ephemeral: true, content: messages[result] ?? "..." });
    }
  });

  client.on("messageCreate", async (message) => {
    const botUser = client.user;
    if (!botUser) return;

    incrementMessagesReceived();

    const isDm = message.channel.type === ChannelType.DM;
    const mentionedBotUser = message.mentions.users.has(botUser.id);
    const botNames = [
      botUser.username.toLowerCase(),
      botUser.globalName?.toLowerCase(),
      botUser.displayName?.toLowerCase(),
    ].filter(Boolean);
    const mentionedBotRole = message.mentions.roles.some(
      (role) => botNames.includes(role.name.toLowerCase()),
    );
    const mentionedBot = mentionedBotUser || mentionedBotRole;
    const guildAllowed = isAllowed(env.allowedGuildIds, message.guildId);
    const channelAllowed = isAllowed(env.allowedChannelIds, message.channelId);
    const repliedToBot = env.enableReplyTrigger ? await isReplyToBot(message, botUser.id) : false;

    logger.debug(
      {
        author: message.author.tag,
        authorBot: message.author.bot,
        isDm,
        mentionedBot,
        guildAllowed,
        channelAllowed,
        repliedToBot,
        guildId: message.guildId,
        channelId: message.channelId,
        content: message.content?.slice(0, 120),
      },
      "messageCreate recebido",
    );

    await tryAutoSaveSolution(message, { id: botUser.id }).catch(
      (e) => logger.warn({ error: e }, "tryAutoSaveSolution falhou"),
    );

    const allowed = shouldRespond({
      isBotAuthor: message.author.bot,
      isDirectMessage: isDm,
      directMessagesEnabled: env.enableDirectMessages,
      mentionedBot,
      repliedToBot,
      replyTriggerEnabled: env.enableReplyTrigger,
      guildAllowed,
      channelAllowed,
    });
    if (!allowed) {
      logger.debug({ author: message.author.tag }, "mensagem ignorada pelo shouldRespond");
      return;
    }

    const rate = limiter.consume(message.author.id);
    if (!rate.allowed) {
      await message.reply(`Muitas solicitações em sequência. Tente novamente em ${Math.ceil(rate.retryAfterMs / 1000)} segundos.`);
      return;
    }

    const question = stripBotMention(message.content, botUser.id);
    if (!question) {
      await message.reply("Envie sua dúvida junto com a menção ao bot.");
      return;
    }
    if (question.length > env.maxInputChars) {
      await message.reply(`A mensagem excede o limite de ${env.maxInputChars} caracteres.`);
      return;
    }

    if (env.enableInputGuard) {
      if (hasCredentials(question)) {
        await message.reply("Detectei possíveis credenciais ou tokens na sua mensagem. Remova-os antes de perguntar.");
        return;
      }
      const scan = scanInput(question);
      if (scan.detected) {
        await message.reply(
          `Sua pergunta parece conter uma tentativa de manipulação do assistente (${scan.reason}). Reformule sem instruções de controle.`,
        );
        return;
      }
    }

    if (env.enableLlmGuard) {
      const verdict = await checkWithGuardLLM(question);
      if (!verdict.safe) {
        logger.warn(
          {
            userIdHash: pseudonymize(message.author.id),
            reason: verdict.reason,
            violated: verdict.violated,
            confidence: verdict.confidence,
          },
          "LLM Guard bloqueou pergunta",
        );
        await message.reply(
          "Sua pergunta foi bloqueada pelo sistema de segurança por conter tentativa de manipulação do assistente.",
        );
        return;
      }
    }

    try {
      await message.channel.sendTyping();
      const startTime = Date.now();
      const result = await embaixadorGraph.invoke(
        {
          question,
          userId: message.author.id,
          displayName: message.member?.displayName ?? message.author.globalName ?? message.author.username,
          channelId: message.channelId,
        },
        {
          runName: "discord_student_question",
          tags: ["discord", "rag", "education"],
          metadata: {
            user_id_hash: pseudonymize(message.author.id),
            guild_id_hash: pseudonymize(message.guildId ?? "dm"),
            channel_id_hash: pseudonymize(message.channelId),
          },
        },
      );
      const duration = Date.now() - startTime;
      recordResponse(duration);
      recordQuestion(message.author.id);
      incrementMessagesResponded();

      await saveConversationTurn({
        userId: message.author.id,
        guildId: message.guildId,
        channelId: message.channelId,
        role: "user",
        content: question,
      });
      await saveConversationTurn({
        userId: message.author.id,
        guildId: message.guildId,
        channelId: message.channelId,
        role: "assistant",
        content: result.answer,
      });

      const chunks = splitDiscordMessage(result.answer);
      for (const [index, chunk] of chunks.entries()) {
        if (index === 0) await message.reply(chunk);
        else await message.channel.send(chunk);
      }

      const isGreeting = result.answer.length < 80
        || /^(ol[áa]|oi|hey|bom dia|boa tarde|boa noite)$/i.test(question.trim())
        || (result.answer.length < 100 && /^ol[áa]/i.test(result.answer));

      if (result.answerSource === "rag_llm" && !isGreeting) {
        const feedbackRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("feedback_yes")
            .setLabel("Funcionou!")
            .setStyle(ButtonStyle.Success)
            .setEmoji("✅"),
          new ButtonBuilder()
            .setCustomId("feedback_no")
            .setLabel("Não funcionou")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("👎"),
        );

        const feedbackMsg = await message.channel.send({
          content: "Esta resposta resolveu sua dúvida?",
          components: [feedbackRow],
        });

        const collector = feedbackMsg.createMessageComponentCollector({
          time: 300_000,
          max: 1,
        });

        collector.on("collect", async (interaction) => {
          if (!interaction.isButton()) return;
          if (interaction.user.id !== message.author.id) {
            await interaction.reply({ content: "Apenas quem perguntou pode avaliar.", ephemeral: true });
            return;
          }

          if (interaction.customId === "feedback_yes") {
            try {
              const compact = await compactSolution(question, result.answer);
              await storeSolution({
                question,
                compactContent: compact,
                userId: message.author.id,
                channelId: message.channelId,
              });
              await insertSolution({
                question,
                answer: result.answer,
                compactContent: compact,
                userId: message.author.id,
                channelId: message.channelId,
                sourceMessageId: null,
              });
              await interaction.update({
                content: "✅ Que bom que resolveu! Salvei essa solução para ajudar outros alunos.",
                components: [],
              });
            } catch {
              await interaction.update({
                content: "✅ Que bom que resolveu!",
                components: [],
              });
            }
          } else {
            await interaction.update({
              content: "👎 Que pena! Peça ajuda com mais detalhes ou reformule a pergunta.",
              components: [],
            });
          }
        });

        collector.on("end", async () => {
          try {
            await feedbackMsg.edit({ components: [] }).catch(() => {});
          } catch { /* ignore */ }
        });
      }
    } catch (error) {
      logger.error(
        {
          error,
          userIdHash: pseudonymize(message.author.id),
          guildIdHash: pseudonymize(message.guildId ?? "dm"),
          channelIdHash: pseudonymize(message.channelId),
        },
        "Erro ao responder mensagem",
      );
      await message.reply(
        "Não consegui processar sua dúvida agora. Verifique a disponibilidade do modelo, os créditos do OpenRouter e a conexão com a base vetorial.",
      );
    }
  });

  return client;
}
