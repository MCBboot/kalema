import { MAX_DISPLAY_NAME_LENGTH } from "../config/constants.js";

type NameValidationResult =
  | { valid: true; name: string }
  | { valid: false; error: string; code: string };

export function validateDisplayName(
  name: unknown,
  existingNames: string[],
): NameValidationResult {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return { valid: false, error: "Display name is required", code: "INVALID_NAME" };
  }

  const trimmed = name.trim();

  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return { valid: false, error: "Display name is too long", code: "NAME_TOO_LONG" };
  }

  if (existingNames.includes(trimmed)) {
    return { valid: false, error: "Display name is already taken", code: "DUPLICATE_NAME" };
  }

  return { valid: true, name: trimmed };
}
