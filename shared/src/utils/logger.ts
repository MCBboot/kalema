function formatMessage(level: string, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level}] [${context}] ${message}`;
  if (data !== undefined) {
    return `${base} ${JSON.stringify(data)}`;
  }
  return base;
}

export function logInfo(context: string, message: string, data?: unknown): void {
  console.log(formatMessage("INFO", context, message, data));
}

export function logWarn(context: string, message: string, data?: unknown): void {
  console.warn(formatMessage("WARN", context, message, data));
}

export function logError(context: string, message: string, data?: unknown): void {
  console.error(formatMessage("ERROR", context, message, data));
}
