export function isLiveMode() {
  return import.meta.env.VITE_PRACTICE_LIVE === "1";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });
  const body = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(body.message ?? body.error ?? "Request failed"), {
      status: response.status,
      body,
    });
  }
  return body as T;
}

export const liveApi = {
  me: () => request("/me"),
  home: () =>
    request<{ overallLevel: string; overallExplanation: string; strategyStatus: string }>("/home"),
  today: () => request("/home/today"),
  conditions: () => request("/conditions"),
  recomputeConditions: () => request("/conditions/recompute", { method: "POST" }),
  invokeAi: (prompt: string) =>
    request("/ai/invoke", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
