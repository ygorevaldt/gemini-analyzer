/**
 * Executes a function with a retry strategy for 429 (Too Many Requests) errors.
 * @param fn The function to execute.
 * @param retries Number of retries remaining.
 * @returns The result of the function.
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // Check for 429 error (Too Many Requests)
    // The Gemini SDK error usually has a status or can be identified by message
    if ((err.status === 429 || err.message?.includes("429")) && retries > 0) {
      const delay = 30000; // 30 seconds
      console.log(`Rate limit reached (429). Retrying after ${delay}ms... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, delay));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
