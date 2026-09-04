import { readFile } from "node:fs/promises";

import {
  evaluateStrategyBenchmarkGate,
  formatStrategyBenchmarkGate,
  runDeterministicProductionStrategyBenchmark,
} from "../lib/strategy-benchmark.ts";

const baseline = JSON.parse(
  await readFile(
    new URL(
      "../../benchmark-baselines/2026-09-neutral-v1.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

const result = evaluateStrategyBenchmarkGate(
  baseline,
  await runDeterministicProductionStrategyBenchmark(),
);

process.stdout.write(`${formatStrategyBenchmarkGate(result)}\n`);
if (!result.passed) process.exitCode = 1;