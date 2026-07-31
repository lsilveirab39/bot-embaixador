import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "../config/env.js";

const model = new ChatOpenRouter({
  model: env.openRouterModel,
  temperature: 0.1,
  maxTokens: 500,
  ...(env.openRouterSiteUrl ? { siteUrl: env.openRouterSiteUrl } : {}),
  ...(env.openRouterSiteName ? { siteName: env.openRouterSiteName } : {}),
  provider: env.denyDataCollection
    ? { data_collection: "deny", allow_fallbacks: true }
    : { allow_fallbacks: true },
});

const COMPACT_PROMPT = `Extraia o conhecimento técnico essencial do par pergunta-resposta abaixo.
Produza um resumo técnico completo, preservando causa raiz, solução e detalhes relevantes.
Ignore saudações, agradecimentos e repetições.

Pergunta: {question}
Resposta: {answer}`;

export async function compactSolution(question: string, answer: string): Promise<string> {
  const prompt = COMPACT_PROMPT
    .replace("{question}", question)
    .replace("{answer}", answer);

  const response = await model.invoke([{ role: "human", content: prompt }]);

  const content = typeof response.content === "string"
    ? response.content
    : Array.isArray(response.content)
      ? response.content.map((b) => (typeof b === "string" ? b : b.type === "text" ? b.text : "")).join("")
      : String(response.content ?? "");

  return content.trim() || answer.slice(0, 300);
}
