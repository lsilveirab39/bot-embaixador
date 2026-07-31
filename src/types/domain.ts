export type ExperienceLevel = "iniciante" | "intermediario" | "avancado";
export type ResponseStyle = "direto" | "didatico" | "socratico";

export interface UserPreferences {
  userId: string;
  language: string;
  experienceLevel: ExperienceLevel;
  responseStyle: ResponseStyle;
  preferredLanguage: string;
  learningGoal: string;
}

export interface RetrievedChunk {
  id: string;
  namespace: string;
  source: string;
  title: string | null;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface SolutionFeedback {
  question: string;
  answer: string;
  compactContent: string;
  userId: string;
  channelId: string;
  sourceMessageId: string | null;
}

export type AnswerSource = "rag_direct" | "rag_llm";
