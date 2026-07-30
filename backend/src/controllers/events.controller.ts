import { Request, Response } from "express";
import { addClient, removeClient, clientCount } from "../services/events.service";
import { logger } from "../utils/logger";

const HEARTBEAT_MS = 25_000;

/**
 * Long-lived Server-Sent Events stream. The client (EventSource) reconnects
 * automatically, so we just keep the socket open and send periodic comments to
 * stop proxies from timing it out.
 */
function stream(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Tell nginx-style proxies not to buffer this response.
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const client = addClient(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ at: Date.now() })}\n\n`);
  logger.info("SSE client connected", {
    userId: req.session.userId,
    clients: clientCount(),
  });

  const heartbeat = setInterval(() => {
    // A comment line keeps the connection alive without firing a client event.
    res.write(": ping\n\n");
  }, HEARTBEAT_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(client);
    logger.info("SSE client disconnected", { clients: clientCount() });
    res.end();
  });
}

export const eventsController = { stream };
