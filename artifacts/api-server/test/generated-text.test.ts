import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGeneratedText } from "../src/lib/generated-text.ts";

test("normalizes nested AI text while preserving labels", () => {
  assert.equal(
    normalizeGeneratedText(
      {
        observation: "The coach paused before responding.",
        inference: "The pause may have created room for reflection.",
      },
      "insight",
    ),
    "Observation: The coach paused before responding.\nInference: The pause may have created room for reflection.",
  );
});

test("rejects generated fields without usable text", () => {
  assert.throws(
    () => normalizeGeneratedText({ observation: null, score: 3 }, "insight"),
    /did not contain text/,
  );
});