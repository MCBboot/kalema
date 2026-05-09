import { MAX_DISPLAY_NAME_LENGTH } from "@kalema/shared/dist/config/constants.js";

export interface CreateRoomPayload {
  displayName: string;
}

export interface JoinRoomPayload {
  code: string;
  displayName: string;
}

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; error: string; code: string };

export function validateCreateRoom(payload: unknown): ValidationResult<CreateRoomPayload> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid payload", code: "INVALID_PAYLOAD" };
  }

  const p = payload as Record<string, unknown>;

  if (!p.displayName || typeof p.displayName !== "string" || p.displayName.trim().length === 0) {
    return { valid: false, error: "Display name is required", code: "INVALID_NAME" };
  }

  if (p.displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
    return { valid: false, error: "Display name is too long", code: "NAME_TOO_LONG" };
  }

  return {
    valid: true,
    data: {
      displayName: p.displayName.trim(),
    },
  };
}

export function validateJoinRoom(payload: unknown): ValidationResult<JoinRoomPayload> {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid payload", code: "INVALID_PAYLOAD" };
  }

  const p = payload as Record<string, unknown>;

  if (!p.code || typeof p.code !== "string" || p.code.trim().length === 0) {
    return { valid: false, error: "Room code is required", code: "INVALID_CODE" };
  }

  if (!p.displayName || typeof p.displayName !== "string" || p.displayName.trim().length === 0) {
    return { valid: false, error: "Display name is required", code: "INVALID_NAME" };
  }

  if (p.displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
    return { valid: false, error: "Display name is too long", code: "NAME_TOO_LONG" };
  }

  return {
    valid: true,
    data: {
      code: p.code.trim(),
      displayName: p.displayName.trim(),
    },
  };
}
