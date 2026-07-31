import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "../config/env.js";
import { getRecentConversation } from "../repositories/conversations.js";
import { getPreferences } from "../repositories/preferences.js";
import { OpenRouterEmbeddings } from "../rag/openrouter-embeddings.js";
import { searchKnowledge } from "../rag/vector-repository.js";
import type { AnswerSource, ConversationTurn, RetrievedChunk, UserPreferences } from "../types/domain.js";
import { buildSystemPrompt, formatContext, formatHistory, formatQuestion } from "./prompts.js";

const CONFIDENCE_THRESHOLD = 0.70;
const RAG_DIRECT_NAMESPACE = "solutions";

const EmbaixadorState = Annotation.Root({
  question: Annotation<string>(),
  userId: Annotation<string>(),
  displayName: Annotation<string>(),
  channelId: Annotation<string>(),
  preferences: Annotation<UserPreferences>(),
  history: Annotation<ConversationTurn[]>(),
  documents: Annotation<RetrievedChunk[]>(),
  answer: Annotation<string>(),
  confidence: Annotation<number>(),
  answerSource: Annotation<AnswerSource>(),
});

const embeddings = new OpenRouterEmbeddings();
const model = new ChatOpenRouter({
  model: env.openRouterModel,
  temperature: 0.2,
  maxTokens: env.maxOutputTokens,
  ...(env.openRouterSiteUrl ? { siteUrl: env.openRouterSiteUrl } : {}),
  ...(env.openRouterSiteName ? { siteName: env.openRouterSiteName } : {}),
  provider: env.denyDataCollection
    ? { data_collection: "deny", allow_fallbacks: true }
    : { allow_fallbacks: true },
});

async function loadUserContext(state: typeof EmbaixadorState.State) {
  const [preferences, history] = await Promise.all([
    getPreferences(state.userId),
    getRecentConversation(state.userId, state.channelId, env.maxHistoryMessages),
  ]);
  return { preferences, history };
}

async function retrieve(state: typeof EmbaixadorState.State) {
  const query = [
    state.question,
    state.preferences.learningGoal,
    `nível:${state.preferences.experienceLevel}`,
    `linguagem:${state.preferences.preferredLanguage}`,
  ]
    .filter(Boolean)
    .join("\n");
  const embedding = await embeddings.embedQuery(query);
  const namespaces = env.ragNamespaces.includes(RAG_DIRECT_NAMESPACE)
    ? env.ragNamespaces
    : [...env.ragNamespaces, RAG_DIRECT_NAMESPACE];
  const documents = await searchKnowledge({
    embedding,
    namespaces,
    topK: env.ragTopK,
    minScore: env.ragMinScore,
  });

  const maxScore = documents[0]?.score ?? 0;
  return { documents, confidence: maxScore };
}

function routeAfterRetrieve(state: typeof EmbaixadorState.State): string {
  const top = state.documents[0];
  if (top && state.confidence >= CONFIDENCE_THRESHOLD && top.namespace === RAG_DIRECT_NAMESPACE) {
    return "answer_from_rag";
  }
  return "generate_answer";
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content == null ? "" : String(content);
  return content
    .map((block: unknown) => {
      if (typeof block === "string") return block;
      if (block && typeof block === "object" && "text" in block) {
        return String((block as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("");
}

async function answerFromRag(state: typeof EmbaixadorState.State) {
  const top = state.documents[0]!;
  const scorePct = (top.score * 100).toFixed(1);
  return {
    answer: `📚 *Base de conhecimento (solução validada)*\n\n${top.content}\n\n-# Fonte: ${top.title || "solução anterior"} · Similaridade: ${scorePct}%`,
    answerSource: "rag_direct" as AnswerSource,
  };
}

async function answer(state: typeof EmbaixadorState.State) {
  const response = await model.invoke([
    new SystemMessage(buildSystemPrompt(state.preferences)),
    new HumanMessage(
      `${formatQuestion(state.displayName, state.question)}\n\nHistórico recente:\n${formatHistory(state.history)}\n\nContexto RAG autorizado:\n${formatContext(state.documents)}`,
    ),
  ]);

  const content = extractTextContent(response.content);
  return {
    answer: content.trim() || "Não consegui produzir uma resposta válida.",
    answerSource: "rag_llm" as AnswerSource,
  };
}

export const embaixadorGraph = new StateGraph(EmbaixadorState)
  .addNode("load_user_context", loadUserContext)
  .addNode("retrieve", retrieve)
  .addNode("answer_from_rag", answerFromRag)
  .addNode("generate_answer", answer)
  .addEdge(START, "load_user_context")
  .addEdge("load_user_context", "retrieve")
  .addConditionalEdges("retrieve", routeAfterRetrieve, {
    answer_from_rag: "answer_from_rag",
    generate_answer: "generate_answer",
  })
  .addEdge("answer_from_rag", END)
  .addEdge("generate_answer", END)
  .compile();
