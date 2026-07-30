/*
  Minimal structured logger. Kept dependency-free on purpose; swap the sink for
  pino/winston later without changing call sites. Never log secrets, passwords,
  session ids, or raw tokens.
*/
type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (meta !== undefined) {
    sink(line, meta);
  } else {
    sink(line);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
