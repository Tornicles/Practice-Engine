import { openai } from "@workspace/integrations-openai-ai-server";

export const assetStrategies = {
  framework: "Methodology synthesis",
  exercise: "Skill application design",
  "case-study": "Evidence-backed case narrative",
  content: "Authority content repurposing",
  workshop: "Experiential learning design",
  course: "Experience-backed curriculum architecture",
  offer: "Expertise-to-offer packaging",
  brand: "Evidence-led brand positioning",
} as const;

export const promptLibraryContext = `
The system has access to a broad marketing and productivity strategy library covering
marketing strategy, brand strategy, copywriting, social media, brand identity and analysis,
competitor and market analysis, SEO, paid acquisition, influencer strategy, visual creation,
pricing, distribution, sales, CRM, and productivity.

Never expose prompt numbers or raw templates. Select and adapt only the relevant strategic
pattern. The source library is supporting infrastructure, not evidence. Claims must come from
the coach's profile, lived experience, practice, methodology, or proof.
`;

export async function generateStructured<T>(
  system: string,
  user: string,
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.6-luna",
    max_completion_tokens: 2500,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${system}\n${promptLibraryContext}` },
      { role: "user", content: user },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("The intelligence engine returned an empty response.");
  }

  return JSON.parse(content) as T;
}