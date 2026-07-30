import { Response } from "express";
import { logger } from "../utils/logger";

/*
  Tiny in-process pub/sub for Server-Sent Events.

  Holds the open SSE responses and writes to them when domain data changes.
  Events carry only a type + minimal metadata — never entity payloads — so a
  stream can't leak data the client isn't otherwise authorised to fetch.

  Single-process only: with multiple instances, back this with Redis pub/sub so
  every node broadcasts to its own connected clients.
*/
export interface SseClient {
  id: number;
  res: Response;
}

let nextId = 1;
const clients = new Set<SseClient>();

export function addClient(res: Response): SseClient {
  const client: SseClient = { id: nextId++, res };
  clients.add(client);
  return client;
}

export function removeClient(client: SseClient): void {
  clients.delete(client);
}

export function clientCount(): number {
  return clients.size;
}

/** Pushes an event to every connected client. Never throws. */
export function broadcast(
  event: string,
  data: Record<string, unknown> = {}
): void {
  if (clients.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify({
    ...data,
    at: Date.now(),
  })}\n\n`;

  for (const client of [...clients]) {
    try {
      client.res.write(payload);
    } catch (err) {
      logger.warn("Dropping dead SSE client", { id: client.id });
      clients.delete(client);
    }
  }
}
