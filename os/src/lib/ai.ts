import { createServerFn } from "@tanstack/react-start";

async function chat(system: string, user: string, max_tokens = 500) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.4,
      max_tokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  return { ok: true as const, text: body.choices[0]?.message.content ?? "" };
}

function parseJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const extractExperience = createServerFn({ method: "POST" })
  .validator((input: { situation: string; action: string; result: string; reflection: string }) => input)
  .handler(async ({ data }) => {
    const out = await chat(
      "You extract coaching expertise from lived experience. Never invent clients, credentials, or outcomes. Return JSON only.",
      `Situation: ${data.situation}\nAction: ${data.action}\nResult: ${data.result}\nReflection: ${data.reflection}\n\nReturn JSON: {"title":"","lesson":"","principle":"","insight":"","frameworkCandidate":"","evidenceGap":"","confidence":0.0}`,
      500,
    );
    if (!out.ok) return out;
    const json = parseJson(out.text);
    if (!json) return { ok: false as const, error: "Could not parse extraction" };
    return {
      ok: true as const,
      title: String(json.title ?? "Untitled experience"),
      lesson: String(json.lesson ?? ""),
      principle: String(json.principle ?? ""),
      insight: String(json.insight ?? ""),
      frameworkCandidate: String(json.frameworkCandidate ?? ""),
      evidenceGap: String(json.evidenceGap ?? ""),
    };
  });

export const simulateClientTurn = createServerFn({ method: "POST" })
  .validator((input: { scenario: string; history: { role: string; text: string }[] }) => input)
  .handler(async ({ data }) => {
    const transcript = data.history
      .map((t) => `${t.role === "coach" ? "Coach" : "Client"}: ${t.text}`)
      .join("\n");
    const out = await chat(
      `You are the client in this coaching simulation: ${data.scenario}. Stay in character. 2-4 sentences. Do not break character. Do not coach the coach.`,
      transcript || "The coach has just sat down. Open in character.",
      220,
    );
    if (!out.ok) return out;
    return { ok: true as const, text: out.text.trim() };
  });

export const evaluatePractice = createServerFn({ method: "POST" })
  .validator((input: { scenario: string; history: { role: string; text: string }[] }) => input)
  .handler(async ({ data }) => {
    const transcript = data.history
      .map((t) => `${t.role === "coach" ? "Coach" : "Client"}: ${t.text}`)
      .join("\n");
    const out = await chat(
      "You evaluate coaching practice against listening, questioning, reframing, and challenge. Do not declare mastery. Return JSON only. Scores 0-100.",
      `Scenario: ${data.scenario}\n\n${transcript}\n\nReturn JSON: {"overall":0,"listening":0,"questioning":0,"reframing":0,"challenge":0,"strengths":"","weaknesses":"","missed":"","nextPractice":""}`,
      400,
    );
    if (!out.ok) return out;
    const json = parseJson(out.text);
    if (!json) return { ok: false as const, error: "Could not parse evaluation" };
    return {
      ok: true as const,
      overall: Number(json.overall) || 0,
      listening: Number(json.listening) || 0,
      questioning: Number(json.questioning) || 0,
      reframing: Number(json.reframing) || 0,
      challenge: Number(json.challenge) || 0,
      strengths: String(json.strengths ?? ""),
      weaknesses: String(json.weaknesses ?? ""),
      missed: String(json.missed ?? ""),
      nextPractice: String(json.nextPractice ?? ""),
    };
  });

export const draftReply = createServerFn({ method: "POST" })
  .validator((input: { withName: string; subject: string; history: string; style: string }) => input)
  .handler(async ({ data }) => {
    const out = await chat(
      "You draft a coach's reply. Short, diagnostic, no jargon, no invented claims. 2-5 sentences.",
      `Person: ${data.withName}\nSubject: ${data.subject}\nStyle: ${data.style}\n\nThread:\n${data.history}`,
      220,
    );
    if (!out.ok) return out;
    return { ok: true as const, text: out.text.trim() };
  });

export const askHelp = createServerFn({ method: "POST" })
  .validator((input: { question: string; context: string }) => input)
  .handler(async ({ data }) => {
    const out = await chat(
      "You explain Practice Engine to a coach. Never mention backend engines, prompt libraries, or internal architecture. Speak in the coach's working areas: Home, Development, Clients, Content, Messages, Help, Settings. Be concrete.",
      `${data.context}\n\nQuestion: ${data.question}`,
      400,
    );
    if (!out.ok) return out;
    return { ok: true as const, text: out.text.trim() };
  });
