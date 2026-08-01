import { Client, EmbedBuilder, Routes } from "discord.js";
import { pool } from "../db/pool.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export interface RoleConfig {
  name: string;
  roleId: string | undefined;
  emoji: string;
}

function buildRoles(): RoleConfig[] {
  return [
    { name: "Estrela do Ranking", roleId: env.roleEstrela, emoji: "⭐" },
    { name: "Top 3", roleId: env.roleTop3, emoji: "🏆" },
    { name: "Gênio", roleId: env.roleGenio, emoji: "🧠" },
    { name: "Mentor", roleId: env.roleMentor, emoji: "📚" },
    { name: "Dedicado", roleId: env.roleDedicado, emoji: "🎯" },
  ];
}

async function getAwardedRoles(
  guildId: string,
): Promise<Map<string, Set<string>>> {
  try {
    const result = await pool.query(
      `SELECT user_id, role_name FROM user_rewards WHERE guild_id = $1`,
      [guildId],
    );
    const map = new Map<string, Set<string>>();
    for (const row of result.rows) {
      const set = map.get(row.user_id) ?? new Set<string>();
      set.add(row.role_name);
      map.set(row.user_id, set);
    }
    return map;
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao buscar cargos concedidos");
    return new Map();
  }
}

async function saveReward(
  guildId: string,
  userId: string,
  roleName: string,
  roleId: string,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO user_rewards (user_id, guild_id, role_name, role_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, guild_id, role_name) DO NOTHING`,
      [userId, guildId, roleName, roleId],
    );
  } catch (error) {
    logger.error({ error, guildId, userId, roleName }, "Erro ao salvar cargo");
  }
}

async function removeReward(
  guildId: string,
  userId: string,
  roleName: string,
): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM user_rewards WHERE user_id = $1 AND guild_id = $2 AND role_name = $3`,
      [userId, guildId, roleName],
    );
  } catch (error) {
    logger.error({ error, guildId, userId, roleName }, "Erro ao remover cargo");
  }
}

async function getTopRanking(
  guildId: string,
): Promise<{ userId: string; totalPoints: number }[]> {
  try {
    const result = await pool.query(
      `SELECT user_id, total_points FROM game_ranking
       WHERE guild_id = $1
       ORDER BY total_points DESC
       LIMIT 3`,
      [guildId],
    );
    return result.rows.map((r) => ({
      userId: r.user_id,
      totalPoints: r.total_points,
    }));
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao buscar ranking");
    return [];
  }
}

async function getAllPlayersByGuild(
  guildId: string,
): Promise<string[]> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT user_id FROM game_ranking WHERE guild_id = $1
       UNION
       SELECT DISTINCT user_id FROM game_history WHERE guild_id = $1`,
      [guildId],
    );
    return result.rows.map((r) => r.user_id);
  } catch (error) {
    logger.error({ error, guildId }, "Erro ao buscar jogadores da guild");
    return [];
  }
}

async function getUserGameStats(
  guildId: string,
  userId: string,
): Promise<{ gamesPlayed: number; totalPoints: number; bestAccuracy: number }> {
  try {
    const rankingResult = await pool.query(
      `SELECT games_played, total_points FROM game_ranking
       WHERE user_id = $1 AND guild_id = $2`,
      [userId, guildId],
    );

    const historyResult = await pool.query(
      `SELECT correct, total FROM game_history
       WHERE user_id = $1 AND guild_id = $2 AND total > 0`,
      [userId, guildId],
    );

    const row = rankingResult.rows[0];
    const gamesPlayed = row?.games_played ?? 0;
    const totalPoints = row?.total_points ?? 0;

    let bestAccuracy = 0;
    for (const h of historyResult.rows) {
      const acc = h.correct / h.total;
      if (acc > bestAccuracy) bestAccuracy = acc;
    }

    return { gamesPlayed, totalPoints, bestAccuracy };
  } catch (error) {
    logger.error({ error, guildId, userId }, "Erro ao buscar stats do usuário");
    return { gamesPlayed: 0, totalPoints: 0, bestAccuracy: 0 };
  }
}

async function addRoleToMember(
  client: Client,
  guildId: string,
  userId: string,
  roleId: string,
): Promise<boolean> {
  try {
    await client.rest.put(Routes.guildMemberRole(guildId, userId, roleId));
    return true;
  } catch (error) {
    logger.warn({ error, guildId, userId, roleId }, "Erro ao adicionar cargo via REST");
    return false;
  }
}

async function removeRoleFromMember(
  client: Client,
  guildId: string,
  userId: string,
  roleId: string,
): Promise<boolean> {
  try {
    await client.rest.delete(Routes.guildMemberRole(guildId, userId, roleId));
    return true;
  } catch (error) {
    logger.warn({ error, guildId, userId, roleId }, "Erro ao remover cargo via REST");
    return false;
  }
}

async function getMemberName(
  client: Client,
  guildId: string,
  userId: string,
): Promise<string> {
  try {
    const member = await client.rest.get(Routes.guildMember(guildId, userId)) as {
      nick?: string;
      user?: { username: string };
    };
    return member.nick ?? member.user?.username ?? userId;
  } catch {
    return userId;
  }
}

interface CheckResult {
  memberId: string;
  displayName: string;
  newRoles: string[];
}

export async function checkAndAssignRoles(
  client: Client,
  guildId: string,
): Promise<CheckResult[]> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return [];

  const playerIds = await getAllPlayersByGuild(guildId);
  if (playerIds.length === 0) return [];

  const topRanking = await getTopRanking(guildId);
  const topIds = new Set(topRanking.map((r) => r.userId));
  const awarded = await getAwardedRoles(guildId);
  const roles = buildRoles();
  const results: CheckResult[] = [];

  for (const userId of playerIds) {
    const stats = await getUserGameStats(guildId, userId);
    const memberAwarded = awarded.get(userId) ?? new Set<string>();
    const newRoles: string[] = [];

    const isTop1 = topRanking[0]?.userId === userId;
    const isTop3 = topIds.has(userId);
    const hasGenio = stats.bestAccuracy >= 0.8 && stats.gamesPlayed >= 1;
    const hasMentor = stats.gamesPlayed >= 10 && stats.totalPoints >= 5000;
    const hasDedicado = stats.gamesPlayed >= 10;

    const criteria: { config: RoleConfig; meets: boolean }[] = [
      { config: roles[0]!, meets: isTop1 },
      { config: roles[1]!, meets: isTop3 },
      { config: roles[2]!, meets: hasGenio },
      { config: roles[3]!, meets: hasMentor },
      { config: roles[4]!, meets: hasDedicado },
    ];

    for (const { config, meets } of criteria) {
      if (!config.roleId) continue;

      const alreadyAwarded = memberAwarded.has(config.name);

      if (meets && !alreadyAwarded) {
        const ok = await addRoleToMember(client, guildId, userId, config.roleId);
        if (ok) {
          await saveReward(guildId, userId, config.name, config.roleId);
          newRoles.push(`${config.emoji} ${config.name}`);
        }
      } else if (!meets && alreadyAwarded) {
        const ok = await removeRoleFromMember(client, guildId, userId, config.roleId);
        if (ok) {
          await removeReward(guildId, userId, config.name);
        }
      }
    }

    if (newRoles.length > 0) {
      const displayName = await getMemberName(client, guildId, userId);
      results.push({ memberId: userId, displayName, newRoles });
    }
  }

  return results;
}

export function buildRewardEmbed(results: CheckResult[]): EmbedBuilder | null {
  if (results.length === 0) return null;

  const lines = results.map(
    (r) => `<@${r.memberId}> desbloqueou: ${r.newRoles.join(", ")}`,
  );

  return new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("🏆 Conquistas desbloqueadas!")
    .setDescription(lines.join("\n"))
    .setFooter({ text: "Continue estudando para desbloquear mais cargos!" });
}
