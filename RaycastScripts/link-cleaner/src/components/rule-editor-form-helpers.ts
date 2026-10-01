function parseAllowParams(rawValue: string): string[] {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  );
}

function formatAllowParams(values: string[]): string {
  return values.join(", ");
}

export { formatAllowParams, parseAllowParams };
