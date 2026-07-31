import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
import { env } from "../config/env.js";

interface OpenRouterEmbeddingsParams extends EmbeddingsParams {
  apiKey?: string;
  model?: string;
  dimensions?: number;
  siteUrl?: string;
  siteName?: string;
}

interface EmbeddingResponse {
  data?: Array<{ index: number; embedding: number[] }>;
  error?: { message?: string };
}

export class OpenRouterEmbeddings extends Embeddings {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimensions: number;
  private readonly siteUrl: string | undefined;
  private readonly siteName: string | undefined;

  constructor(params: OpenRouterEmbeddingsParams = {}) {
    super(params);
    this.apiKey = params.apiKey ?? env.openRouterApiKey;
    this.model = params.model ?? env.openRouterEmbeddingModel;
    this.dimensions = params.dimensions ?? env.embeddingDimensions;
    this.siteUrl = params.siteUrl ?? env.openRouterSiteUrl;
    this.siteName = params.siteName ?? env.openRouterSiteName;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    if (documents.length === 0) return [];
    return this.request(documents);
  }

  async embedQuery(document: string): Promise<number[]> {
    const [embedding] = await this.request([document]);
    if (!embedding) throw new Error("OpenRouter não retornou embedding para a consulta");
    return embedding;
  }

  private async request(input: string[]): Promise<number[][]> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    if (this.siteUrl) headers["HTTP-Referer"] = this.siteUrl;
    if (this.siteName) headers["X-OpenRouter-Title"] = this.siteName;

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        input,
        dimensions: this.dimensions,
        encoding_format: "float",
        provider: { allow_fallbacks: true },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const body = (await response.json()) as EmbeddingResponse;
    if (!response.ok || !body.data) {
      throw new Error(
        `Falha no embedding OpenRouter (${response.status}): ${body.error?.message ?? "erro desconhecido"}`,
      );
    }

    return body.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}
