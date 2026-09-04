import { readFile } from "node:fs/promises";

import {
  compareStrategyBenchmarkHistory,
  evaluateStrategyBenchmarkGate,
  formatStrategyBenchmarkHistory,
  formatStrategyBenchmarkGate,
  parseStrategyBenchmarkFixture,
  runDeterministicProductionStrategyBenchmark,
} from "../lib/strategy-benchmark.ts";

const fixturePaths = JSON.parse(
  await readFile(
    new URL("../../benchmark-baselines/release-history.json", import.meta.url),
    "utf8",
  ),
);
if (!Array.isArray(fixturePaths) || fixturePaths.length === 0) {
  throw new Error("Strategy benchmark release history must list at least one fixture.");
}
const fixtures = await Promise.all(
  fixturePaths.map(async (fixturePath) =>
    parseStrategyBenchmarkFixture(
      JSON.parse(
        await readFile(
          new URL(`../../benchmark-baselines/${fixturePath}`, import.meta.url),
          "utf8",
        ),
      ),
    ),
  ),
);
const baseline = [...fixtures].sort((a, b) =>
  a.recordedAt.localeCompare(b.recordedAt),
).at(-1)!.benchmark;
const current = await runDeterministicProductionStrategyBenchmark();
const result = evaluateStrategyBenchmarkGate(baseline, current);
const history = compareStrategyBenchmarkHistory(fixtures, current);

process.stdout.write(
  `${formatStrategyBenchmarkGate(result)}\nHistorical release comparison:\n${formatStrategyBenchmarkHistory(history)}\n`,
);
if (!result.passed) process.exitCode = 1;