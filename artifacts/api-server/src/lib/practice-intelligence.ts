import { openai } from "@workspace/integrations-openai-ai-server";
import {
  type StrategySelection,
} from "./strategy-library";
import {
  completeIntelligenceJson,
  type IntelligenceCompletionClient,
} from "./intelligence-completion";
import {
  runStructuredIntelligencePipeline,
  type IntelligenceTrace,
} from "./structured-intelligence-pipeline";
export {
  IntelligenceSafetyError,
  type IntelligenceTrace,
} from "./structured-intelligence-pipeline";

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

export async function generateStructured<T>(
  system: string,
  user: string,
  selection: StrategySelection,
): Promise<{ data: T; trace: IntelligenceTrace }> {
  return generateStructuredWithClient(system, user, selection, openai);
}

export async function generateStructuredWithClient<T>(
  system: string,
  user: string,
  selection: StrategySelection,
  client: IntelligenceCompletionClient,
): Promise<{ data: T; trace: IntelligenceTrace }> {
  return runStructuredIntelligencePipeline(
    system,
    user,
    selection,
    <Result>(completionSystem: string, completionUser: string) =>
      completeIntelligenceJson<Result>(
        client,
        completionSystem,
        completionUser,
      ),
  );
}