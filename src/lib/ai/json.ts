import type { z } from "zod";

/** Pull the first JSON object/array out of a model reply (handles ```json fences and chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(body);
  } catch {
    const start = body.search(/[[{]/);
    if (start === -1) throw new Error("No JSON found in model output");
    const open = body[start];
    const close = open === "{" ? "}" : "]";
    const end = body.lastIndexOf(close);
    if (end <= start) throw new Error("Unterminated JSON in model output");
    return JSON.parse(body.slice(start, end + 1));
  }
}

export class InvalidModelOutputError extends Error {}

/**
 * Ask the model, validate with zod, and on failure ask again with the
 * validation error as feedback. Never returns unvalidated output.
 */
export async function parseWithRetry<S extends z.ZodType>(
  schema: S,
  ask: (attempt: number, feedback: string | null) => Promise<string>,
  maxAttempts = 3,
): Promise<z.infer<S>> {
  let feedback: string | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const text = await ask(attempt, feedback);
    try {
      const result = schema.safeParse(extractJson(text));
      if (result.success) return result.data;
      feedback = `Your JSON did not match the schema: ${result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ")}. Reply with corrected JSON only.`;
    } catch (e) {
      feedback = `Your reply was not valid JSON (${(e as Error).message}). Reply with JSON only.`;
    }
  }
  throw new InvalidModelOutputError(`Model output failed validation after ${maxAttempts} attempts`);
}
