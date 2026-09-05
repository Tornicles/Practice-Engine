export function sufficiencyFor(sampleSize: number) {
  if (sampleSize <= 0) return "insufficient";
  if (sampleSize <= 2) return "weak";
  if (sampleSize <= 7) return "moderate";
  return "strong";
}

export function confidenceFor(sampleSize: number, scoreSource: string) {
  if (sampleSize <= 0) return "none";
  if (scoreSource === "ai_draft" && sampleSize < 8) return sampleSize <= 2 ? "low" : "medium";
  if (scoreSource === "ai_draft") return "medium";
  if (sampleSize <= 2) return "low";
  if (sampleSize <= 7) return "medium";
  return "high";
}

export function projectsIntoLevel(scoreSource: string, accepted: boolean) {
  return accepted && scoreSource !== "ai_draft";
}
