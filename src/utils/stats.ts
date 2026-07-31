const BOOT_TIME = Date.now();

const MAX_RESPONSE_TIMES = 100;

interface UserStats {
  questionsToday: number;
  questionsThisWeek: number;
  questionsThisMonth: number;
  totalQuestions: number;
}

interface BotStats {
  messagesReceived: number;
  messagesResponded: number;
  totalQuestionsAllUsers: number;
  responseTimes: number[];
  userStats: Map<string, UserStats>;
}

const stats: BotStats = {
  messagesReceived: 0,
  messagesResponded: 0,
  totalQuestionsAllUsers: 0,
  responseTimes: [],
  userStats: new Map(),
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function resetIfNeeded(user: UserStats, today: string, week: string, month: string): void {
  const currentStats = stats.userStats.get(today);
  if (currentStats !== user) return;
  const t = todayKey();
  const w = weekKey();
  const m = monthKey();
  if (today !== t) user.questionsToday = 0;
  if (week !== w) user.questionsThisWeek = 0;
  if (month !== m) user.questionsThisMonth = 0;
}

export function incrementMessagesReceived(): void {
  stats.messagesReceived++;
}

export function incrementMessagesResponded(): void {
  stats.messagesResponded++;
}

export function recordQuestion(userId: string): void {
  const t = todayKey();
  const w = weekKey();
  const m = monthKey();
  const key = `${userId}`;
  let user = stats.userStats.get(key);
  if (!user) {
    user = { questionsToday: 0, questionsThisWeek: 0, questionsThisMonth: 0, totalQuestions: 0 };
    stats.userStats.set(key, user);
  }
  resetIfNeeded(user, t, w, m);
  user.questionsToday++;
  user.questionsThisWeek++;
  user.questionsThisMonth++;
  user.totalQuestions++;
  stats.totalQuestionsAllUsers++;
}

export function recordResponse(durationMs: number): void {
  stats.responseTimes.push(durationMs);
  if (stats.responseTimes.length > MAX_RESPONSE_TIMES) {
    stats.responseTimes.shift();
  }
}

export function getBootTime(): number {
  return BOOT_TIME;
}

export function getUptime(): string {
  const diff = Date.now() - BOOT_TIME;
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 60_000) % 60;
  const hours = Math.floor(diff / 3_600_000) % 24;
  const days = Math.floor(diff / 86_400_000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function getUserStats(userId: string): UserStats {
  const t = todayKey();
  const w = weekKey();
  const m = monthKey();
  const key = `${userId}`;
  let user = stats.userStats.get(key);
  if (!user) {
    user = { questionsToday: 0, questionsThisWeek: 0, questionsThisMonth: 0, totalQuestions: 0 };
    stats.userStats.set(key, user);
  }
  resetIfNeeded(user, t, w, m);
  return { ...user };
}

export function getBotStats(): {
  messagesReceived: number;
  messagesResponded: number;
  totalQuestionsAllUsers: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  uptime: string;
  bootTime: Date;
} {
  const times = stats.responseTimes;
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const max = times.length > 0 ? Math.max(...times) : 0;
  const min = times.length > 0 ? Math.min(...times) : 0;
  return {
    messagesReceived: stats.messagesReceived,
    messagesResponded: stats.messagesResponded,
    totalQuestionsAllUsers: stats.totalQuestionsAllUsers,
    averageResponseTime: Math.round(avg),
    maxResponseTime: Math.round(max),
    minResponseTime: Math.round(min),
    uptime: getUptime(),
    bootTime: new Date(BOOT_TIME),
  };
}
