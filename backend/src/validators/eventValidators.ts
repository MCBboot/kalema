export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validatePayload<T>(
  payload: unknown,
  requiredFields: string[],
): payload is T {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const p = payload as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in p) || p[field] === undefined || p[field] === null) {
      return false;
    }
  }

  return true;
}
