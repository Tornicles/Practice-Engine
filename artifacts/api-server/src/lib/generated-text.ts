function readableLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function collectGeneratedText(value: unknown): string[] {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectGeneratedText);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const nestedText = collectGeneratedText(nestedValue);
      if (nestedText.length === 0) return [];
      return [`${readableLabel(key)}: ${nestedText.join(" ")}`];
    });
  }

  return [];
}

export function normalizeGeneratedText(value: unknown, fieldName: string): string {
  const text = collectGeneratedText(value).join("\n");
  if (!text) {
    throw new TypeError(`Generated field "${fieldName}" did not contain text.`);
  }
  return text;
}