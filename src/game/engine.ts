import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type Message,
  type TextChannel,
} from "discord.js";
import { logger } from "../config/logger.js";
import {
  type Question,
  type Theme,
  THEME_LABELS,
  getQuestions,
  getRandomTheme,
} from "./questions.js";
import { saveGameResult } from "./ranking.js";
import { checkAndAssignRoles, buildRewardEmbed } from "./roles.js";

const JOIN_TIMEOUT_MS = 30_000;
const QUESTION_TIME_MS = 30_000;
const QUESTIONS_PER_GAME = 10;

const EMOJI_OPTIONS = ["🔴", "🟡", "🟢", "🔵"] as const;
const BUTTON_IDS = ["game_opt_0", "game_opt_1", "game_opt_2", "game_opt_3"] as const;

export interface GameSession {
  channelId: string;
  guildId: string;
  theme: Theme | null;
  players: Map<string, { userId: string; displayName: string; score: number }>;
  answers: Map<string, { theme: string; correct: boolean }[]>;
  answeredCurrent: Set<string>;
  currentQuestion: number;
  questions: Question[];
  message: Message | null;
  running: boolean;
  startedBy: string;
}

const activeGames = new Map<string, GameSession>();

export function getActiveGame(channelId: string): GameSession | undefined {
  return activeGames.get(channelId);
}

export function hasActiveGame(channelId: string): boolean {
  return activeGames.has(channelId);
}

export async function startGame(
  channel: TextChannel,
  starterUserId: string,
  themeInput: string | null,
): Promise<void> {
  if (activeGames.has(channel.id)) {
    await channel.send("Já existe um jogo em andamento neste canal!");
    return;
  }

  const theme: Theme | null = themeInput ? (themeInput as Theme) : getRandomTheme();
  const themeLabel = THEME_LABELS[theme] ?? "Geral";

  const session: GameSession = {
    channelId: channel.id,
    guildId: channel.guildId,
    theme,
    players: new Map(),
    answers: new Map(),
    answeredCurrent: new Set(),
    currentQuestion: 0,
    questions: [],
    message: null,
    running: false,
    startedBy: starterUserId,
  };

  activeGames.set(channel.id, session);

  const joinEmbed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎮 Novo Jogo Iniciado!")
    .setDescription(
      `**Tema:** ${themeLabel}\n\n` +
        `Reaja com 🎮 para entrar!\n` +
        `O jogo começa em **30 segundos** ou quando todos estiverem prontos.`,
    )
    .setFooter({ text: "Use /game <tema> para escolher o tema" });

  const joinMsg = await channel.send({ embeds: [joinEmbed] });
  await joinMsg.react("🎮");
  session.message = joinMsg;

  await new Promise((resolve) => setTimeout(resolve, JOIN_TIMEOUT_MS));

  if (!activeGames.has(channel.id)) {
    return;
  }

  if (session.players.size === 0) {
    await channel.send("Ninguém entrou no jogo. Jogo cancelado!");
    activeGames.delete(channel.id);
    return;
  }

  session.running = true;
  session.questions = await getQuestions(channel.guildId, theme, QUESTIONS_PER_GAME);

  await runGameLoop(session, channel);
}

async function runGameLoop(session: GameSession, channel: TextChannel): Promise<void> {
  for (let i = 0; i < session.questions.length; i++) {
    if (!activeGames.has(session.channelId)) {
      return;
    }

    session.currentQuestion = i;
    session.answeredCurrent = new Set();
    const question = session.questions[i]!;
    await sendQuestion(session, channel, question, i + 1);
    await countdown(session, channel, QUESTION_TIME_MS);
    await revealAnswer(session, channel, question, i + 1);

    if (i < session.questions.length - 1 && session.players.size >= 2) {
      await sendScoreboard(session, channel);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  await endGame(session, channel);
}

async function sendQuestion(
  session: GameSession,
  channel: TextChannel,
  question: Question,
  number: number,
): Promise<void> {
  const themeLabel = THEME_LABELS[question.theme as Theme] ?? question.theme;

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(`Pergunta ${number}/${session.questions.length}`)
    .setDescription(`**${question.question}**`)
    .setFooter({ text: `Tema: ${themeLabel} | 30 segundos para responder` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    question.options.map(
      (opt, idx) =>
        new ButtonBuilder()
          .setCustomId(BUTTON_IDS[idx]!)
          .setLabel(`${EMOJI_OPTIONS[idx]} ${opt}`)
          .setStyle(ButtonStyle.Secondary),
    ),
  );

  const msg = await channel.send({ embeds: [embed], components: [row] });
  session.message = msg;
}

async function countdown(session: GameSession, channel: TextChannel, ms: number): Promise<void> {
  const seconds = Math.floor(ms / 1000);

  for (let remaining = seconds; remaining > 0; remaining--) {
    if (!activeGames.has(session.channelId)) {
      return;
    }

    if (session.players.size > 0 && session.answeredCurrent.size >= session.players.size) {
      break;
    }

    if (remaining === 10) {
      const timerEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle(`⏱️ ${remaining}s restantes`)
        .setDescription("Última chance de responder!");

      await channel.send({ embeds: [timerEmbed] }).catch(() => {});
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function revealAnswer(
  session: GameSession,
  channel: TextChannel,
  question: Question,
  number: number,
): Promise<void> {
  const correctLabel = EMOJI_OPTIONS[question.correctIndex]!;
  const correctText = question.options[question.correctIndex]!;

  if (session.message) {
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      question.options.map(
        (opt, idx) =>
          new ButtonBuilder()
            .setCustomId(BUTTON_IDS[idx]!)
            .setLabel(`${EMOJI_OPTIONS[idx]} ${opt}`)
            .setStyle(idx === question.correctIndex ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true),
      ),
    );

    await session.message.edit({ components: [disabledRow] }).catch(() => {});
  }

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`Resposta — Pergunta ${number}`)
    .setDescription(
      `**${question.question}**\n\n` +
        `✅ Resposta correta: **${correctLabel} ${correctText}**`,
    );

  await channel.send({ embeds: [embed] });
}

export type AnswerResult = "correct" | "wrong" | "already_answered" | "game_not_running";

export async function handleAnswer(
  session: GameSession,
  userId: string,
  displayName: string,
  optionIndex: number,
): Promise<AnswerResult> {
  if (!session.running) return "game_not_running";
  if (session.answeredCurrent.has(userId)) return "already_answered";

  if (!session.players.has(userId)) {
    session.players.set(userId, { userId, displayName, score: 0 });
  }

  const question = session.questions[session.currentQuestion]!;
  const isCorrect = optionIndex === question.correctIndex;
  const player = session.players.get(userId)!;

  session.answeredCurrent.add(userId);

  if (isCorrect) {
    player.score += 1000;
  }

  const userAnswers = session.answers.get(userId) ?? [];
  userAnswers.push({ theme: question.theme, correct: isCorrect });
  session.answers.set(userId, userAnswers);

  return isCorrect ? "correct" : "wrong";
}

function getScoreboard(session: GameSession): { displayName: string; score: number; correct: number; total: number }[] {
  return Array.from(session.players.values())
    .map((p) => {
      const userAnswers = session.answers.get(p.userId) ?? [];
      const correct = userAnswers.filter((a) => a.correct).length;
      return {
        displayName: p.displayName,
        score: p.score,
        correct,
        total: userAnswers.length,
      };
    })
    .sort((a, b) => b.score - a.score);
}

async function sendScoreboard(session: GameSession, channel: TextChannel): Promise<void> {
  const board = getScoreboard(session);
  if (board.length === 0) return;

  const lines = board.map(
    (p, i) => `**${i + 1}º** ${p.displayName} — ${p.score} pts (${p.correct}/${p.total})`,
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📊 Placar Atual")
    .setDescription(lines.join("\n"));

  await channel.send({ embeds: [embed] });
}

async function endGame(session: GameSession, channel: TextChannel): Promise<void> {
  session.running = false;
  activeGames.delete(session.channelId);

  const board = getScoreboard(session);

  for (const [userId, answers] of session.answers) {
    const player = session.players.get(userId);
    if (!player) continue;

    const correct = answers.filter((a) => a.correct).length;
    await saveGameResult(
      userId,
      session.guildId,
      THEME_LABELS[session.theme!] ?? "Geral",
      player.score,
      correct,
      answers.length,
    );
  }

  const medals = ["🥇", "🥈", "🥉"];
  const podiumLines: string[] = [];

  for (let i = 0; i < Math.min(3, board.length); i++) {
    const p = board[i]!;
    podiumLines.push(`${medals[i]} **${i + 1}º Lugar:** ${p.displayName} — ${p.score} pts`);
  }

  if (board.length > 3) {
    podiumLines.push("");
    podiumLines.push("**Demais participantes:**");
    for (let i = 3; i < board.length; i++) {
      const p = board[i]!;
      podiumLines.push(`${i + 1}º ${p.displayName} — ${p.score} pts`);
    }
  }

  const themeAggregated = new Map<string, { correct: number; total: number }>();
  for (const [, answers] of session.answers) {
    for (const a of answers) {
      const existing = themeAggregated.get(a.theme) ?? { correct: 0, total: 0 };
      existing.total++;
      if (a.correct) existing.correct++;
      themeAggregated.set(a.theme, existing);
    }
  }

  const themeLines = Array.from(themeAggregated.entries())
    .map(([theme, stats]) => {
      const label = THEME_LABELS[theme as Theme] ?? theme;
      const emoji = stats.correct / stats.total >= 0.5 ? "✅" : "❌";
      return `${emoji} **${label}:** ${stats.correct}/${stats.total}`;
    })
    .slice(0, 8);

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("🏆 RESULTADO FINAL")
    .setDescription(podiumLines.join("\n"));

  if (themeLines.length > 0) {
    embed.addFields({
      name: "📊 Desempenho por Tema",
      value: themeLines.join("\n"),
    });
  }

  embed.setFooter({ text: "Use /ranking para ver o ranking completo" });

  await channel.send({ embeds: [embed] });

  try {
    const results = await checkAndAssignRoles(channel.client, session.guildId);
    const rewardEmbed = buildRewardEmbed(results);
    if (rewardEmbed) {
      await channel.send({ embeds: [rewardEmbed] });
    }
  } catch (error) {
    logger.warn({ error }, "Erro ao verificar cargos de recompensa");
  }
}

export function cleanupGame(channelId: string): void {
  activeGames.delete(channelId);
}
