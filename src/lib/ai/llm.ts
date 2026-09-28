import "server-only";

import { EMBEDDING_DIM } from "@/lib/constants";
import { isLlmConfigured, serverEnv } from "@/lib/env";

/**
 * LLM provider adapter. Default provider: Google Gemini via @google/genai.
 * Adds: timeouts, retries with exponential backoff, a small concurrency
 * queue, and an in-process cache. Callers MUST check `assertAiAllowed()`
 * (src/lib/policy.ts) before sending any content here.
 */

export class LlmUnavailableError extends Error {
  status = 503;
}
export class LlmRateLimitError extends Error {
  status = 429;
}

export interface GenerateOptions {
  system?: string;
  json?: boolean;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmProvider {
  name: string;
  model: string;
  generate(prompt: string, opts?: GenerateOptions): Promise<string>;
  embed(texts: string[]): Promise<number[][]>;
}

// ------------------------------------------------------------------ queue
const MAX_CONCURRENT = 3;
let active = 0;
const waiting: (() => void)[] = [];
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((r) => waiting.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiting.shift()?.();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fn(ctrl.signal);
    } catch (e) {
      last = e;
      const status = (e as { status?: number }).status;
      if (status && status < 500 && status !== 429) break; // not retryable
      if (i < attempts - 1) await sleep(400 * 2 ** i + Math.random() * 200);
    } finally {
      clearTimeout(timer);
    }
  }
  const status = (last as { status?: number })?.status;
  if (status === 429) throw new LlmRateLimitError("The AI service is busy (rate limit). Please try again in a minute.");
  throw new LlmUnavailableError(`AI service unavailable: ${(last as Error)?.message ?? "unknown error"}`);
}

// ------------------------------------------------------------------ cache
const cache = new Map<string, { at: number; value: unknown }>();
const TTL = 1000 * 60 * 60 * 6;
export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit.value as T);
  return fn().then((value) => {
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 500) cache.delete(cache.keys().next().value!);
    return value;
  });
}

// ------------------------------------------------------------------ gemini
class GeminiProvider implements LlmProvider {
  name = "gemini";
  constructor(
    private apiKey: string,
    public model: string,
    private embeddingModel: string,
  ) {}

  private async client() {
    const { GoogleGenAI } = await import("@google/genai");
    return new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generate(prompt: string, opts: GenerateOptions = {}) {
    const ai = await this.client();
    return withSlot(() =>
      withRetry(async (abortSignal) => {
        const res = await ai.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            systemInstruction: opts.system,
            temperature: opts.temperature ?? 0.3,
            responseMimeType: opts.json ? "application/json" : undefined,
            abortSignal,
          },
        });
        const text = res.text;
        if (!text) throw Object.assign(new Error("Empty model response"), { status: 500 });
        return text;
      }, opts.timeoutMs ?? 45000),
    );
  }

  async embed(texts: string[]) {
    const ai = await this.client();
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 50) {
      const batch = texts.slice(i, i + 50);
      const res = await withSlot(() =>
        withRetry(
          (abortSignal) =>
            ai.models.embedContent({
              model: this.embeddingModel,
              contents: batch,
              config: { outputDimensionality: EMBEDDING_DIM, abortSignal },
            }),
          30000,
        ),
      );
      for (const e of res.embeddings ?? []) out.push(e.values ?? []);
    }
    return out;
  }
}

let provider: LlmProvider | null = null;

/** The configured provider, or null when AI is unavailable (no key / DEMO_MODE). */
export function getLlm(): LlmProvider | null {
  if (!isLlmConfigured()) return null;
  if (!provider) {
    const env = serverEnv();
    provider = new GeminiProvider(env.geminiKey, env.llmModel, env.embeddingModel);
  }
  return provider;
}

/** Embed a search query; returns null when AI is unavailable (keyword-only fallback). */
export async function embedQuery(q: string): Promise<number[] | null> {
  const llm = getLlm();
  if (!llm || !q.trim()) return null;
  try {
    return await cached(`q:${q.trim().toLowerCase()}`, async () => (await llm.embed([`task: search result | query: ${q}`]))[0] ?? null);
  } catch {
    return null;
  }
}
