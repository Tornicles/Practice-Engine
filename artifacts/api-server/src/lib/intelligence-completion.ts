export interface IntelligenceCompletionClient {
  chat: {
    completions: {
      create(
        request: {
          model: string;
          max_completion_tokens: number;
          response_format: { type: "json_object" };
          messages: Array<{ role: "system" | "user"; content: string }>;
        },
        options: { signal: AbortSignal },
      ): Promise<{ choices: Array<{ message: { content: string | null } }> }>;
    };
  };
}

export async function completeIntelligenceJson<T>(
  client: IntelligenceCompletionClient,
  system: string,
  user: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await client.chat.completions.create(
        {
          model: "gpt-5.6-luna",
          max_completion_tokens: 8192,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        },
        { signal: controller.signal },
      );
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("The intelligence engine returned an empty response.");
      }
      return JSON.parse(content) as T;
    } catch (error) {
      lastError = error;
      if (attempt === 4) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(1500 * 2 ** attempt, 12_000)),
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}