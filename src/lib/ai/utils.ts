/**
 * Executes a function with a retry strategy for transient API errors.
 * @param fn The function to execute.
 * @param retries Number of retries remaining.
 * @returns The result of the function.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const message = String(err?.message || "").toLowerCase();
    const status = Number(err?.status || 0);
    const shouldRetry =
      retries > 0 &&
      (status === 429 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes("429") ||
        message.includes("too many requests") ||
        message.includes("timeout") ||
        message.includes("temporarily unavailable"));

    if (shouldRetry) {
      const delay = 30000 * (4 - retries);
      console.log(
        `Transient error detected (${status || message}). Retrying after ${delay}ms... (${retries} retries left)`,
      );
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1);
    }

    throw err;
  }
}

function extractJsonObject(text: string): string | null {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return text.slice(firstBrace, lastBrace + 1);
}

function stripMarkdown(text: string): string {
  // Removes Markdown code block wrappers like ```json and ```
  return text.replace(/```(?:json)?\n?([\s\S]*?)```/g, "$1").trim();
}

function sanitizeJsonText(text: string): string {
  return text
    .replace(/\r/g, " ")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/[\u0000-\u001F]+/g, " ")
    .trim();
}

function repairJson(text: string): string {
  let repaired = text.trim();

  // Handle case where text ends in the middle of a string property
  if (repaired.split('"').length % 2 === 0) {
    repaired += '"';
  }

  const stack: string[] = [];
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if (char === "}" || char === "]") {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }

  // Close unclosed structures in reverse order
  while (stack.length > 0) {
    const closing = stack.pop();
    repaired += closing;
  }

  return repaired;
}

export function safeParseJson<T = any>(text: string, context = ""): T | null {
  if (!text) {
    return null;
  }

  const cleanedText = stripMarkdown(text);

  try {
    return JSON.parse(cleanedText) as T;
  } catch (firstError) {
    const extracted = extractJsonObject(cleanedText);
    if (!extracted) {
      console.error(`safeParseJson failed to find JSON object for context: ${context}`);
      return null;
    }

    try {
      return JSON.parse(extracted) as T;
    } catch (secondError) {
      const cleaned = sanitizeJsonText(extracted);
      try {
        return JSON.parse(cleaned) as T;
      } catch (thirdError) {
        const repaired = repairJson(cleaned);
        try {
          return JSON.parse(repaired) as T;
        } catch (fourthError) {
          console.error(`safeParseJson failed to parse JSON for context: ${context}`, {
            firstError,
            secondError,
            thirdError,
            fourthError,
            snippet: extracted.slice(0, 1000),
          });
          return null;
        }
      }
    }
  }
}
